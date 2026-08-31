import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

/**
 * Helper to get MongoDB User profile from req.user (Firebase UID)
 */
const getMongoUser = async (firebaseUID) => {
  return await User.findOne({ firebaseUID });
};

/**
 * @route   POST /api/transactions/interest
 * @desc    Buyer expresses interest in a product
 * @access  Private (Authenticated)
 */
router.post('/interest', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Valid Product ID is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found'
      });
    }

    // Edge Case 1: Prevent buyer from expressing interest in their own product
    if (product.ownerId.toString() === mongoUser._id.toString()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'You cannot express interest in your own product listing'
      });
    }

    // Edge Case 2: Prevent interest if item is no longer available
    if (product.status !== 'Available') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Item is no longer available for ${product.listingType.toLowerCase()} (Status: ${product.status})`
      });
    }

    // Edge Case 3: Prevent duplicate pending/accepted interest from same buyer for same product
    const existingInterest = await Transaction.findOne({
      productId,
      buyerId: mongoUser._id,
      status: { $in: ['Pending', 'Accepted'] }
    });

    if (existingInterest) {
      return res.status(409).json({
        success: false,
        data: existingInterest,
        message: 'You have already expressed interest in this product'
      });
    }

    // Create new Transaction
    const transaction = new Transaction({
      productId: product._id,
      buyerId: mongoUser._id,
      sellerId: product.ownerId,
      type: product.listingType === 'Rent' ? 'Rent' : 'Buy',
      status: 'Pending'
    });

    await transaction.save();

    // Create Notification for the seller
    const notification = new Notification({
      recipientId: product.ownerId,
      type: 'Interest',
      message: `${mongoUser.name} expressed interest in your listing '${product.title}'`,
      relatedTransactionId: transaction._id
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      data: transaction,
      message: 'Interest request sent to seller successfully'
    });
  } catch (error) {
    console.error('Error expressing interest:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error processing interest request'
    });
  }
});

/**
 * @route   GET /api/transactions/check-interest/:productId
 * @desc    Check if logged-in user has expressed interest in a product
 * @access  Private (Authenticated)
 */
router.get('/check-interest/:productId', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Product ID format'
      });
    }

    const existingTx = await Transaction.findOne({
      productId,
      buyerId: mongoUser._id,
      status: { $in: ['Pending', 'Accepted', 'Completed'] }
    });

    return res.status(200).json({
      success: true,
      data: {
        hasExpressedInterest: Boolean(existingTx),
        status: existingTx ? existingTx.status : null,
        transaction: existingTx
      },
      message: 'Interest status retrieved'
    });
  } catch (error) {
    console.error('Error checking interest status:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error checking interest status'
    });
  }
});

/**
 * @route   PATCH /api/transactions/:id/respond
 * @desc    Seller accepts or rejects an interest request
 * @access  Private (Seller only)
 */
router.patch('/:id/respond', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['Accept', 'Reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Action must be either "Accept" or "Reject"'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Transaction ID format'
      });
    }

    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Transaction request not found'
      });
    }

    // Access Control: Only the seller can accept or reject
    if (transaction.sellerId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Only the seller can respond to interest requests'
      });
    }

    if (transaction.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `This request has already been ${transaction.status.toLowerCase()}`
      });
    }

    const product = await Product.findById(transaction.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Associated product listing not found'
      });
    }

    if (action === 'Accept') {
      // 1. Mark target transaction as Accepted
      transaction.status = 'Accepted';
      transaction.updatedAt = new Date();
      await transaction.save();

      // 2. Update Product status (Sold or Rented) and set soldAt for 24-hour TTL deletion
      product.status = product.listingType === 'Rent' ? 'Rented' : 'Sold';
      product.soldAt = new Date();
      await product.save();

      // 3. Auto-reject ALL OTHER pending requests for this same product
      const otherPendingTxs = await Transaction.find({
        productId: transaction.productId,
        _id: { $ne: transaction._id },
        status: 'Pending'
      });

      for (const otherTx of otherPendingTxs) {
        otherTx.status = 'Rejected';
        otherTx.updatedAt = new Date();
        await otherTx.save();

        // Create rejection notification for other buyers
        const autoRejectNotify = new Notification({
          recipientId: otherTx.buyerId,
          type: 'Rejected',
          message: `Your request for '${product.title}' was auto-declined as the seller accepted another buyer.`,
          relatedTransactionId: otherTx._id
        });
        await autoRejectNotify.save();
      }

      // 4. Create Notification for the accepted buyer
      const acceptNotify = new Notification({
        recipientId: transaction.buyerId,
        type: 'Accepted',
        message: `Great news! ${mongoUser.name} accepted your request for '${product.title}'.`,
        relatedTransactionId: transaction._id
      });
      await acceptNotify.save();

      return res.status(200).json({
        success: true,
        data: transaction,
        message: 'Request accepted. Product marked as ' + product.status
      });
    } else {
      // Action === 'Reject'
      transaction.status = 'Rejected';
      transaction.updatedAt = new Date();
      await transaction.save();

      // Notification for rejected buyer
      const rejectNotify = new Notification({
        recipientId: transaction.buyerId,
        type: 'Rejected',
        message: `${mongoUser.name} declined your interest request for '${product.title}'.`,
        relatedTransactionId: transaction._id
      });
      await rejectNotify.save();

      return res.status(200).json({
        success: true,
        data: transaction,
        message: 'Request declined'
      });
    }
  } catch (error) {
    console.error('Error responding to transaction:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error responding to transaction request'
    });
  }
});

/**
 * @route   GET /api/transactions/incoming
 * @desc    Get all incoming requests for logged-in seller
 * @access  Private (Authenticated)
 */
router.get('/incoming', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    // Fetch incoming transactions where req.user is seller OR buyer (for user requests management)
    const incoming = await Transaction.find({ sellerId: mongoUser._id })
      .populate('productId', 'title images cost listingType status description')
      .populate('buyerId', 'name profilePhotoUrl email role branch year company designation')
      .sort({ createdAt: -1 });

    const outgoing = await Transaction.find({ buyerId: mongoUser._id })
      .populate('productId', 'title images cost listingType status description')
      .populate('sellerId', 'name profilePhotoUrl email role branch year company designation')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        incoming: incoming || [],
        outgoing: outgoing || []
      },
      message: 'Transactions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching incoming transactions:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching transaction requests'
    });
  }
});

/**
 * @route   PATCH /api/transactions/:id/complete
 * @desc    Mark transaction status as Completed (unlocks rating eligibility)
 * @access  Private (Buyer or Seller only)
 */
router.patch('/:id/complete', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Transaction ID format'
      });
    }

    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Transaction not found'
      });
    }

    // Authorization: Must be buyer or seller of the transaction
    const isBuyer = transaction.buyerId.toString() === mongoUser._id.toString();
    const isSeller = transaction.sellerId.toString() === mongoUser._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You are not a party to this transaction'
      });
    }

    if (transaction.status === 'Completed') {
      return res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction is already marked as completed'
      });
    }

    if (transaction.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Only accepted transactions can be marked as completed'
      });
    }

    transaction.status = 'Completed';
    transaction.updatedAt = new Date();
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction marked as completed successfully'
    });
  } catch (error) {
    console.error('Error completing transaction:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error completing transaction'
    });
  }
});

export default router;

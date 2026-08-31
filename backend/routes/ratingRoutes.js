import express from 'express';
import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
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
 * @route   POST /api/ratings
 * @desc    Submit rating & feedback for a completed transaction
 * @access  Private (Buyer of transaction only)
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const { transactionId, stars, comment } = req.body;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Valid Transaction ID is required'
      });
    }

    const starRating = Number(stars);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Rating stars must be a number between 1 and 5'
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Transaction not found'
      });
    }

    // Edge Case 1: Must be Completed
    if (transaction.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Rating can only be submitted after the transaction status is Completed'
      });
    }

    // Edge Case 2: Must be the buyer
    if (transaction.buyerId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Only the buyer of this transaction can rate the seller'
      });
    }

    // Edge Case 3: Prevent duplicate rating
    if (transaction.ratingGiven) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'Rating has already been submitted for this transaction'
      });
    }

    const existingRatingDoc = await Rating.findOne({ transactionId });
    if (existingRatingDoc) {
      transaction.ratingGiven = true;
      await transaction.save();
      return res.status(409).json({
        success: false,
        data: existingRatingDoc,
        message: 'Rating has already been submitted for this transaction'
      });
    }

    // Create Rating document
    const newRating = new Rating({
      transactionId: transaction._id,
      productId: transaction.productId,
      ratedBy: mongoUser._id,
      ratedSeller: transaction.sellerId,
      stars: starRating,
      comment: comment ? comment.trim() : ''
    });

    await newRating.save();

    // Mark transaction as rated
    transaction.ratingGiven = true;
    await transaction.save();

    // Create Notification for the seller
    const product = await Product.findById(transaction.productId);
    const ratingNotification = new Notification({
      recipientId: transaction.sellerId,
      type: 'RatingReceived',
      message: `${mongoUser.name} gave you a ${starRating}-star rating for '${product?.title || 'your listing'}'!`,
      relatedTransactionId: transaction._id
    });

    await ratingNotification.save();

    return res.status(201).json({
      success: true,
      data: newRating,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error submitting rating'
    });
  }
});

/**
 * @route   GET /api/ratings/user/:userId
 * @desc    Fetch all ratings & computed average score for a seller
 * @access  Public / Authenticated
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid User ID format'
      });
    }

    const ratings = await Rating.find({ ratedSeller: userId })
      .populate('ratedBy', 'name profilePhotoUrl')
      .populate('productId', 'title images')
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    let averageRating = 0;

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
      averageRating = Math.round((sum / totalRatings) * 10) / 10;
    }

    return res.status(200).json({
      success: true,
      data: {
        ratings: ratings || [],
        averageRating,
        totalRatings
      },
      message: 'User seller ratings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching user ratings'
    });
  }
});

export default router;

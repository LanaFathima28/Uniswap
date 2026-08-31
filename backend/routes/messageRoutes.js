import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

/**
 * Helper to get MongoDB User from req.user (Firebase UID)
 */
const getMongoUser = async (userObj) => {
  const uid = typeof userObj === 'string' ? userObj : (userObj?.firebaseUID || userObj?.uid);
  if (!uid) return null;
  return await User.findOne({ firebaseUID: uid });
};

/**
 * @route   POST /api/messages
 * @desc    Send a chat message for an accepted or completed transaction
 * @access  Private (Authorized Buyer or Seller)
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user);
    if (!mongoUser) {
      return res.status(404).json({ success: false, data: null, message: 'User profile not found' });
    }

    const { transactionId, receiverId, text } = req.body;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, data: null, message: 'Valid transaction ID is required' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, data: null, message: 'Message text cannot be empty' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, data: null, message: 'Transaction not found' });
    }

    // Verify transaction status allows messaging
    if (!['Accepted', 'Completed'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Messaging is only enabled after a transaction request has been Accepted'
      });
    }

    // Verify access control: caller must be buyer or seller
    const isBuyer = transaction.buyerId.toString() === mongoUser._id.toString();
    const isSeller = transaction.sellerId.toString() === mongoUser._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You can only message on transactions you are part of'
      });
    }

    const recipientMongoId = isBuyer ? transaction.sellerId : transaction.buyerId;

    const newMessage = new Message({
      transactionId: transaction._id,
      senderId: mongoUser._id,
      receiverId: recipientMongoId,
      text: text.trim()
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name profilePhotoUrl email role')
      .populate('receiverId', 'name profilePhotoUrl email role');

    return res.status(201).json({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error sending message'
    });
  }
});

/**
 * @route   GET /api/messages/conversations
 * @desc    Fetch all active chat conversations for the logged-in user
 * @access  Private
 */
router.get('/conversations', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user);
    if (!mongoUser) {
      return res.status(404).json({ success: false, data: null, message: 'User profile not found' });
    }

    // Find all transactions where status is Accepted or Completed involving this user
    const transactions = await Transaction.find({
      $or: [{ buyerId: mongoUser._id }, { sellerId: mongoUser._id }],
      status: { $in: ['Accepted', 'Completed'] }
    })
      .populate('productId', 'title images cost listingType status')
      .populate('buyerId', 'name profilePhotoUrl email role branch year company designation')
      .populate('sellerId', 'name profilePhotoUrl email role branch year company designation')
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(
      transactions.map(async (tx) => {
        const isBuyer = tx.buyerId?._id?.toString() === mongoUser._id.toString();
        const peer = isBuyer ? tx.sellerId : tx.buyerId;

        // Fetch latest message
        const lastMessage = await Message.findOne({ transactionId: tx._id }).sort({ createdAt: -1 });

        // Count unread messages for this user in this transaction
        const unreadCount = await Message.countDocuments({
          transactionId: tx._id,
          receiverId: mongoUser._id,
          isRead: false
        });

        return {
          transactionId: tx._id,
          transactionStatus: tx.status,
          transactionType: tx.type || tx.productId?.listingType || 'Buy',
          product: tx.productId,
          peer,
          myRole: isBuyer ? 'Buyer' : 'Seller',
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
                isRead: lastMessage.isRead
              }
            : null,
          unreadCount,
          updatedAt: tx.updatedAt || tx.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: conversations,
      message: 'Conversations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching conversations'
    });
  }
});

/**
 * @route   GET /api/messages/transaction/:transactionId
 * @desc    Fetch chat history for a specific transaction
 * @access  Private (Authorized Buyer or Seller)
 */
router.get('/transaction/:transactionId', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user);
    if (!mongoUser) {
      return res.status(404).json({ success: false, data: null, message: 'User profile not found' });
    }

    const { transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid transaction ID' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, data: null, message: 'Transaction not found' });
    }

    const isBuyer = transaction.buyerId.toString() === mongoUser._id.toString();
    const isSeller = transaction.sellerId.toString() === mongoUser._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, data: null, message: 'Forbidden: Access denied' });
    }

    const messages = await Message.find({ transactionId })
      .populate('senderId', 'name profilePhotoUrl role')
      .populate('receiverId', 'name profilePhotoUrl role')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: messages,
      message: 'Messages retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching transaction messages:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching messages'
    });
  }
});

/**
 * @route   PATCH /api/messages/transaction/:transactionId/read
 * @desc    Mark unread messages in a transaction as read
 * @access  Private
 */
router.patch('/transaction/:transactionId/read', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user);
    if (!mongoUser) {
      return res.status(404).json({ success: false, data: null, message: 'User profile not found' });
    }

    const { transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid transaction ID' });
    }

    await Message.updateMany(
      { transactionId, receiverId: mongoUser._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages read:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error updating message status'
    });
  }
});

export default router;

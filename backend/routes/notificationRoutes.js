import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

/**
 * Helper to get MongoDB User profile from req.user (Firebase UID)
 */
const getMongoUser = async (firebaseUID) => {
  return await User.findOne({ firebaseUID });
};

/**
 * @route   GET /api/notifications
 * @desc    Fetch all notifications for logged-in user (sorted newest first)
 * @access  Private (Authenticated)
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const notifications = await Notification.find({ recipientId: mongoUser._id })
      .populate({
        path: 'relatedTransactionId',
        populate: {
          path: 'productId',
          select: 'title images'
        }
      })
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching notifications'
    });
  }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications for logged-in user as read
 * @access  Private (Authenticated)
 * NOTE: Placed BEFORE /:id/read route to prevent URL parameter conflict.
 */
router.patch('/read-all', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    await Notification.updateMany(
      { recipientId: mongoUser._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      data: null,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error marking notifications read'
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private (Recipient only)
 */
router.patch('/:id/read', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Notification ID format'
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

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Notification not found'
      });
    }

    // Access Control: Only recipient can mark read
    if (notification.recipientId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You can only update your own notifications'
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error updating notification'
    });
  }
});

export default router;

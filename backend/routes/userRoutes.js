import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

/**
 * @route   GET /api/users/search
 * @desc    Search user directory by keywords (Name, Branch, Year, Company, Designation, Role)
 * @access  Private (Authenticated)
 */
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { keyword, role, branch, year, company } = req.query;

    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (branch && branch.trim()) {
      query.branch = new RegExp(branch.trim(), 'i');
    }

    if (year && year.trim()) {
      query.year = new RegExp(year.trim(), 'i');
    }

    if (company && company.trim()) {
      query.company = new RegExp(company.trim(), 'i');
    }

    if (keyword && keyword.trim()) {
      const term = keyword.trim();
      const regex = new RegExp(term, 'i');

      query.$or = [
        { name: regex },
        { email: regex },
        { branch: regex },
        { year: regex },
        { company: regex },
        { designation: regex },
        { role: regex }
      ];
    }

    const users = await User.find(query)
      .select('-__v')
      .sort({ name: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error searching user directory'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Fetch any user's profile by MongoDB _id (Public/Authenticated)
 * @access  Public / Authenticated
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid User ID format'
      });
    }

    const user = await User.findById(id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error retrieving user profile'
    });
  }
});

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user profile data (Name, Branch/Year or Company/Designation, Photo)
 * @access  Private (Owner only)
 */
router.patch('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid User ID format'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    // Access Control: Verify authenticated token owner matches target user profile
    if (req.user.uid !== user.firebaseUID) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You can only edit your own profile'
      });
    }

    const { name, branch, year, company, designation, profilePhotoUrl } = req.body;

    // Validation
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Full name cannot be empty'
        });
      }
      user.name = name.trim();
    }

    if (user.role === 'Student') {
      if (branch !== undefined) {
        if (!branch || !branch.trim()) {
          return res.status(400).json({
            success: false,
            data: null,
            message: 'Branch is required for students'
          });
        }
        user.branch = branch.trim();
      }
      if (year !== undefined) {
        if (!year || !year.trim()) {
          return res.status(400).json({
            success: false,
            data: null,
            message: 'Graduation/Current year is required for students'
          });
        }
        user.year = year.trim();
      }
    } else if (user.role === 'Alumni') {
      if (company !== undefined) {
        if (!company || !company.trim()) {
          return res.status(400).json({
            success: false,
            data: null,
            message: 'Company name is required for alumni'
          });
        }
        user.company = company.trim();
      }
      if (designation !== undefined) {
        if (!designation || !designation.trim()) {
          return res.status(400).json({
            success: false,
            data: null,
            message: 'Designation is required for alumni'
          });
        }
        user.designation = designation.trim();
      }
    }

    if (profilePhotoUrl !== undefined) {
      user.profilePhotoUrl = profilePhotoUrl;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error updating profile'
    });
  }
});

/**
 * @route   GET /api/users/:id/activity
 * @desc    Fetch private activity log (Listed, Bought/Rented, Sold/Rented Out)
 * @access  Private (Owner only)
 */
router.get('/:id/activity', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid User ID format'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    // Access Control: Strict check that authenticated user matches target profile owner
    if (req.user.uid !== user.firebaseUID) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You cannot view another user\'s activity log'
      });
    }

    // Fetch raw activity documents
    const rawListed = await Product.find({ ownerId: id }).sort({ createdAt: -1 });

    const rawBought = await Transaction.find({
      buyerId: id,
      status: { $in: ['Accepted', 'Completed'] }
    }).populate('productId').sort({ createdAt: -1 });

    // 1. Transactions where user is seller and status is Accepted or Completed
    const rawSoldTxs = await Transaction.find({
      sellerId: id,
      status: { $in: ['Accepted', 'Completed'] }
    }).populate('productId').sort({ createdAt: -1 });

    // 2. Products owned by user that are explicitly marked Sold or Rented
    const rawSoldProducts = await Product.find({
      ownerId: id,
      status: { $in: ['Sold', 'Rented'] }
    }).sort({ createdAt: -1 });

    // Deduplicate sold items by product ID
    const soldMap = new Map();

    rawSoldTxs.forEach((tx) => {
      const p = tx.productId;
      const key = (p?._id || tx._id).toString();
      soldMap.set(key, {
        transactionId: tx._id,
        productTitle: p?.title || 'Sold Item',
        productImage: (p?.images && p.images.length > 0) ? p.images[0] : null,
        cost: p?.cost || p?.price || 0,
        type: tx.type === 'Rent' || p?.status === 'Rented' ? 'Rented Out' : 'Sold',
        date: tx.updatedAt || tx.createdAt
      });
    });

    rawSoldProducts.forEach((item) => {
      const key = item._id.toString();
      if (!soldMap.has(key)) {
        soldMap.set(key, {
          transactionId: item._id,
          productTitle: item.title || 'Sold Item',
          productImage: (item.images && item.images.length > 0) ? item.images[0] : null,
          cost: item.cost || item.price || 0,
          type: item.status === 'Rented' ? 'Rented Out' : 'Sold',
          date: item.soldAt || item.createdAt
        });
      }
    });

    // Transform into standard activity response shape
    const listed = rawListed.map((item) => ({
      transactionId: item._id,
      productTitle: item.title || 'Untitled Item',
      productImage: (item.images && item.images.length > 0) ? item.images[0] : null,
      cost: item.cost || 0,
      type: item.status === 'Rented' ? 'Rented' : (item.status === 'Sold' ? 'Sold' : 'Listed'),
      date: item.createdAt
    }));

    const bought = rawBought.map((tx) => ({
      transactionId: tx._id,
      productTitle: tx.productId?.title || 'Purchased Item',
      productImage: (tx.productId?.images && tx.productId.images.length > 0) ? tx.productId.images[0] : null,
      cost: tx.productId?.cost || 0,
      type: tx.productId?.status === 'Rented' ? 'Rented' : 'Bought',
      date: tx.createdAt
    }));

    const sold = Array.from(soldMap.values());

    return res.status(200).json({
      success: true,
      data: {
        listed: listed || [],
        bought: bought || [],
        sold: sold || []
      },
      message: 'User activity log retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error retrieving user activity'
    });
  }
});

export default router;

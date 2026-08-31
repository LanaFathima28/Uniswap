import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
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
 * @route   POST /api/products
 * @desc    Create new product listing
 * @access  Private (Authenticated)
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user);

    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const {
      title,
      description,
      category,
      images,
      cost,
      listingType,
      color,
      usageDuration,
      dimensions,
      hasDamage,
      damageDescription
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Product title is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Product description is required'
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Category is required'
      });
    }

    if (!listingType || !['Sell', 'Rent'].includes(listingType)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Listing type must be either "Sell" or "Rent"'
      });
    }

    if (cost === undefined || cost === null || isNaN(Number(cost)) || Number(cost) < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'A valid cost (>= 0) is required'
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'At least one image is required for the product listing'
      });
    }

    const newProduct = new Product({
      ownerId: mongoUser._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      images,
      cost: Number(cost),
      price: Number(cost),
      listingType,
      color: color ? color.trim() : '',
      usageDuration: usageDuration ? usageDuration.trim() : '',
      dimensions: dimensions ? dimensions.trim() : '',
      hasDamage: Boolean(hasDamage),
      damageDescription: hasDamage && damageDescription ? damageDescription.trim() : '',
      status: 'Available'
    });

    await newProduct.save();

    const populatedProduct = await Product.findById(newProduct._id).populate(
      'ownerId',
      'name profilePhotoUrl email role branch year company designation'
    );

    return res.status(201).json({
      success: true,
      data: populatedProduct,
      message: 'Product listing created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error creating product listing'
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Search & list available products with filters
 * @access  Authenticated / Public
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { keyword, category, minCost, maxCost, listingType } = req.query;

    const queryFilter = { status: 'Available' };

    // Keyword search using MongoDB regex on title + description
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i');
      queryFilter.$or = [
        { title: { $regex: regex } },
        { description: { $regex: regex } }
      ];
    }

    // Exact match for Category if specified and not 'All'
    if (category && category !== 'All') {
      queryFilter.category = category;
    }

    // Exact match for Listing Type if specified and not 'All'
    if (listingType && listingType !== 'All') {
      queryFilter.listingType = listingType;
    }

    // Range filter for cost
    if ((minCost !== undefined && minCost !== '') || (maxCost !== undefined && maxCost !== '')) {
      queryFilter.cost = {};
      if (minCost !== undefined && minCost !== '') {
        queryFilter.cost.$gte = Number(minCost);
      }
      if (maxCost !== undefined && maxCost !== '') {
        queryFilter.cost.$lte = Number(maxCost);
      }
    }

    const products = await Product.find(queryFilter)
      .populate('ownerId', 'name profilePhotoUrl email role branch year company designation')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching products'
    });
  }
});

/**
 * @route   GET /api/products/mine
 * @desc    Get all product listings by logged-in user
 * @access  Private (Authenticated)
 * NOTE: Placed BEFORE /:id route to avoid route matching conflicts.
 */
router.get('/mine', verifyFirebaseToken, async (req, res) => {
  try {
    const mongoUser = await getMongoUser(req.user.firebaseUID);

    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found'
      });
    }

    const { includeSold } = req.query;
    const filter = { ownerId: mongoUser._id };
    if (!includeSold || includeSold !== 'true') {
      filter.status = 'Available';
    }

    const myProducts = await Product.find(filter)
      .populate('ownerId', 'name profilePhotoUrl email role branch year company designation')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: myProducts,
      message: 'User product listings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user products:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching user product listings'
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product full detail
 * @access  Authenticated / Public
 */
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Product ID format'
      });
    }

    const product = await Product.findById(id).populate(
      'ownerId',
      'name profilePhotoUrl email role branch year company designation'
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Product detail retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error fetching product detail'
    });
  }
});

/**
 * @route   PATCH /api/products/:id
 * @desc    Edit own product listing
 * @access  Private (Owner only)
 */
router.patch('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Product ID format'
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

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found'
      });
    }

    // Access Control: Check if logged-in user is owner
    if (product.ownerId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You can only edit your own listings'
      });
    }

    const {
      title,
      description,
      category,
      images,
      cost,
      listingType,
      color,
      usageDuration,
      dimensions,
      hasDamage,
      damageDescription,
      status
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ success: false, data: null, message: 'Title cannot be empty' });
      }
      product.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ success: false, data: null, message: 'Description cannot be empty' });
      }
      product.description = description.trim();
    }

    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({ success: false, data: null, message: 'Category cannot be empty' });
      }
      product.category = category.trim();
    }

    if (listingType !== undefined) {
      if (!['Sell', 'Rent'].includes(listingType)) {
        return res.status(400).json({ success: false, data: null, message: 'Listing type must be Sell or Rent' });
      }
      product.listingType = listingType;
    }

    if (cost !== undefined) {
      if (isNaN(Number(cost)) || Number(cost) < 0) {
        return res.status(400).json({ success: false, data: null, message: 'Cost must be a valid non-negative number' });
      }
      product.cost = Number(cost);
      product.price = Number(cost);
    }

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, data: null, message: 'At least one image is required' });
      }
      product.images = images;
    }

    if (color !== undefined) product.color = color.trim();
    if (usageDuration !== undefined) product.usageDuration = usageDuration.trim();
    if (dimensions !== undefined) product.dimensions = dimensions.trim();

    if (hasDamage !== undefined) {
      product.hasDamage = Boolean(hasDamage);
      if (!hasDamage) {
        product.damageDescription = '';
      }
    }

    if (damageDescription !== undefined && product.hasDamage) {
      product.damageDescription = damageDescription.trim();
    }

    if (status !== undefined && ['Available', 'Sold', 'Rented'].includes(status)) {
      product.status = status;
      if (['Sold', 'Rented'].includes(status)) {
        product.soldAt = new Date();
      } else {
        product.soldAt = null;
      }
    }

    await product.save();

    const updatedProduct = await Product.findById(id).populate(
      'ownerId',
      'name profilePhotoUrl email role branch year company designation'
    );

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error updating product listing'
    });
  }
});

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Seller explicit status toggle (Mark as Sold, Rented, or Available)
 * @access  Private (Listing Owner only)
 */
router.patch('/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid Product ID format' });
    }

    if (!status || !['Available', 'Sold', 'Rented'].includes(status)) {
      return res.status(400).json({ success: false, data: null, message: 'Status must be "Available", "Sold", or "Rented"' });
    }

    const mongoUser = await getMongoUser(req.user);
    if (!mongoUser) {
      return res.status(404).json({ success: false, data: null, message: 'User profile not found' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Product not found' });
    }

    if (product.ownerId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({ success: false, data: null, message: 'Forbidden: You can only update status for your own listing' });
    }

    product.status = status;
    if (['Sold', 'Rented'].includes(status)) {
      product.soldAt = new Date();
    } else {
      product.soldAt = null;
    }

    await product.save();

    const updatedProduct = await Product.findById(id).populate(
      'ownerId',
      'name profilePhotoUrl email role branch year company designation'
    );

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: `Product marked as ${status}. ${['Sold', 'Rented'].includes(status) ? 'It will be automatically removed from database in 24 hours.' : ''}`
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error updating product status'
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete own product listing
 * @access  Private (Owner only)
 */
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid Product ID format'
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

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Product not found'
      });
    }

    // Access Control: Check if logged-in user is owner
    if (product.ownerId.toString() !== mongoUser._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: You can only delete your own listings'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Product listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server error deleting product listing'
    });
  }
});

export default router;

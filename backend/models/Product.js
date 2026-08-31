import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  images: {
    type: [{ type: String }],
    validate: [arr => Array.isArray(arr) && arr.length >= 1, 'At least one image is required']
  },
  cost: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    default: 0 
  },
  listingType: { 
    type: String, 
    enum: ['Sell', 'Rent'], 
    required: true 
  },
  color: { 
    type: String, 
    default: '' 
  },
  usageDuration: { 
    type: String, 
    default: '' 
  },
  dimensions: { 
    type: String, 
    default: '' 
  },
  hasDamage: { 
    type: Boolean, 
    default: false 
  },
  damageDescription: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['Available', 'Sold', 'Rented'], 
    default: 'Available' 
  },
  soldAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// TTL index: automatically delete product from MongoDB 24 hours (86400 seconds) after soldAt timestamp is set
productSchema.index({ soldAt: 1 }, { expireAfterSeconds: 86400 });

// Pre-save middleware to keep price in sync with cost
productSchema.pre('save', function (next) {
  if (this.cost !== undefined) {
    this.price = this.cost;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;

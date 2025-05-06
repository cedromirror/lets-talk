const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    trim: true,
    maxlength: [2000, 'Product description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Please provide a currency'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']
  },
  images: [{
    type: String,
    required: [true, 'Please provide at least one product image']
  }],
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: [
      'Clothing', 'Shoes', 'Jewelry', 'Accessories', 'Beauty', 'Home', 
      'Electronics', 'Sports', 'Books', 'Toys', 'Art', 'Handmade', 'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Please provide inventory quantity'],
      min: [0, 'Quantity cannot be negative']
    },
    sku: {
      type: String,
      trim: true
    },
    variants: [{
      name: String,
      options: [{
        value: String,
        price: Number,
        quantity: Number,
        sku: String
      }]
    }]
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: Number,
    shippingLocations: [{
      type: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'deleted'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  discount: {
    percentage: {
      type: Number,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100']
    },
    startDate: Date,
    endDate: Date
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average rating
ProductSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Virtual for review count
ProductSchema.virtual('reviewCount').get(function() {
  return this.ratings.length;
});

// Virtual for save count
ProductSchema.virtual('saveCount').get(function() {
  return this.saves.length;
});

// Virtual for current price (with discount applied if active)
ProductSchema.virtual('currentPrice').get(function() {
  if (!this.discount || !this.discount.percentage) return this.price;
  
  const now = new Date();
  if (this.discount.startDate && this.discount.startDate > now) return this.price;
  if (this.discount.endDate && this.discount.endDate < now) return this.price;
  
  const discountAmount = (this.price * this.discount.percentage) / 100;
  return (this.price - discountAmount).toFixed(2);
});

// Method to check if a product is in stock
ProductSchema.methods.isInStock = function() {
  return this.inventory.quantity > 0;
};

// Method to check if a user has saved this product
ProductSchema.methods.isSavedByUser = function(userId) {
  return this.saves.some(save => save.toString() === userId.toString());
};

// Index for faster queries
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', ProductSchema);

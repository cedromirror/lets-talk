const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Please provide a business name'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessEmail: {
    type: String,
    required: [true, 'Please provide a business email'],
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Please provide a valid email'
    ]
  },
  businessPhone: {
    type: String,
    required: [true, 'Please provide a business phone number']
  },
  businessAddress: {
    street: {
      type: String,
      required: [true, 'Please provide a street address']
    },
    city: {
      type: String,
      required: [true, 'Please provide a city']
    },
    state: {
      type: String,
      required: [true, 'Please provide a state/province']
    },
    postalCode: {
      type: String,
      required: [true, 'Please provide a postal code']
    },
    country: {
      type: String,
      required: [true, 'Please provide a country']
    }
  },
  businessWebsite: {
    type: String,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },
  businessCategory: {
    type: String,
    required: [true, 'Please provide a business category'],
    enum: [
      'Retail', 'Food & Beverage', 'Health & Beauty', 'Services', 
      'Entertainment', 'Technology', 'Fashion', 'Education', 'Travel', 
      'Home & Garden', 'Art & Design', 'Fitness', 'Other'
    ]
  },
  businessSubcategory: {
    type: String,
    trim: true
  },
  businessDescription: {
    type: String,
    required: [true, 'Please provide a business description'],
    trim: true,
    maxlength: [1000, 'Business description cannot exceed 1000 characters']
  },
  businessLogo: {
    type: String
  },
  businessCoverPhoto: {
    type: String
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    tiktok: String
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: String,
    close: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_id', 'id_proof', 'address_proof', 'other']
    },
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String
  }],
  paymentInfo: {
    paymentMethods: [{
      type: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'paypal', 'stripe', 'other']
      },
      isDefault: {
        type: Boolean,
        default: false
      },
      details: mongoose.Schema.Types.Mixed
    }],
    taxId: String,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  subscriptionPlan: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentHistory: [{
      amount: Number,
      currency: String,
      date: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded']
      },
      transactionId: String
    }]
  },
  analytics: {
    profileViews: {
      type: Number,
      default: 0
    },
    websiteClicks: {
      type: Number,
      default: 0
    },
    callClicks: {
      type: Number,
      default: 0
    },
    emailClicks: {
      type: Number,
      default: 0
    },
    directionClicks: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_review'],
    default: 'pending_review'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for product count
BusinessSchema.virtual('productCount').get(function() {
  return mongoose.model('Product').countDocuments({ seller: this.user });
});

// Index for faster queries
BusinessSchema.index({ user: 1 });
BusinessSchema.index({ businessCategory: 1 });
BusinessSchema.index({ 'businessAddress.city': 1, 'businessAddress.country': 1 });
BusinessSchema.index({ businessName: 'text', businessDescription: 'text' });

module.exports = mongoose.model('Business', BusinessSchema);

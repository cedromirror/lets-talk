 const mongoose = require('mongoose');
const crypto = require('crypto');

const TwoFactorAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  enabled: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate a new secret key
TwoFactorAuthSchema.statics.generateSecret = function() {
  return crypto.randomBytes(20).toString('hex');
};

// Generate backup codes
TwoFactorAuthSchema.statics.generateBackupCodes = function(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character backup codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({
      code,
      used: false
    });
  }
  return codes;
};

// Verify a token against the secret
TwoFactorAuthSchema.methods.verifyToken = function(token) {
  // This is a placeholder - in a real implementation, you would use a library like speakeasy
  // to verify the token against the secret using TOTP algorithm
  // For now, we'll just check if the token matches the first 6 characters of the secret (for demo purposes)
  return token === this.secret.substring(0, 6);
};

// Use a backup code
TwoFactorAuthSchema.methods.useBackupCode = function(code) {
  const backupCode = this.backupCodes.find(bc => bc.code === code && !bc.used);
  
  if (backupCode) {
    backupCode.used = true;
    this.lastUsed = new Date();
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('TwoFactorAuth', TwoFactorAuthSchema);
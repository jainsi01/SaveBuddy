const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Model Schema
 * Represents registered users, authentication credentials, and financial preferences.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true, // EC-2.1: Enforce email normalization
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
      select: false, // Never return password hash by default
    },
    currencyPreference: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    monthlyIncome: {
      type: Number,
      default: null,
      min: [0, 'Monthly income cannot be negative.'],
    },
    savingsConstraints: {
      type: String,
      default: null,
      maxlength: [300, 'Savings constraints note cannot exceed 300 characters.'],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

/**
 * Pre-save Hook: Hashes password if modified or newly created
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Instance Method: Generate signed JSON Web Token
 */
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
    },
    secret,
    { expiresIn }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;

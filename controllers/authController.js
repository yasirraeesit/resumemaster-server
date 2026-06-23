import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_resumemaster_key';

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // Sign JWT
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. ' + err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. ' + err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
      user.email = email.toLowerCase();
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile. ' + err.message });
  }
};

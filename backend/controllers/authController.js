import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import seedDatabase from '../seed.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const mockSendEmail = (email, otp, type) => {
  console.log(`\n========================================`);
  console.log(`📧 MOCK EMAIL SENT TO: ${email}`);
  console.log(`TYPE: ${type}`);
  console.log(`OTP CODE: ${otp}`);
  console.log(`========================================\n`);
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, branch } = req.body;
    
    // 1. Removed .edu restriction for demo

    const emailRegex = new RegExp('^' + email + '$', 'i');
    const userExists = await User.findOne({ email: emailRegex });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      branch: branch || 'CSE'
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`\n--- LOGIN ATTEMPT: ${email} ---`);

    const emailRegex = new RegExp('^' + email + '$', 'i');
    let user = await User.findOne({ email: emailRegex });
    console.log(`USER FOUND IN DB: ${!!user}`);

    // DEMO FALLBACK: upsert so repeated logins never throw duplicate key errors
    if (!user && (email.includes('admin') || email.includes('teacher') || email.includes('student'))) {
      console.log("FALLING BACK TO DEMO USER (upsert)...");
      const role = email.includes('admin') ? 'admin' : email.includes('teacher') ? 'teacher' : 'student';
      const name = role.charAt(0).toUpperCase() + role.slice(1) + " User (Demo)";

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

      // findOneAndUpdate with upsert: creates on first login, returns existing on subsequent logins
      user = await User.findOneAndUpdate(
        { email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
        { $setOnInsert: { name, email: email.toLowerCase(), password: hashedPassword, role, branch: 'CSE' } },
        { upsert: true, new: true }
      );

      return res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id),
      });
    }

    if (!user) {
      console.log("LOGIN FAILED: User not found");
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`PASSWORD MATCH: ${isMatch}`);

    if (isMatch) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id),
      });
    } else {
      console.log("LOGIN FAILED: Invalid password");
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailRegex = new RegExp('^' + email + '$', 'i');
    const user = await User.findOne({ email: emailRegex });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otpAttempts >= 5) return res.status(429).json({ message: 'Too many OTP attempts. Please try again later.' });
    if (!user.otpExpires || user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP has expired.' });
    
    if (user.otp === otp) {
      // Success
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        token: generateToken(user._id),
      });
    } else {
      user.otpAttempts += 1;
      await user.save();
      res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = new RegExp('^' + email + '$', 'i');
    let user = await User.findOne({ email: emailRegex });
    
    if (!user) {
      if (email.includes('admin') || email.includes('teacher') || email.includes('student')) {
        return res.json({ message: 'Proceed to reset password.' });
      }
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Proceed to reset password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const emailRegex = new RegExp('^' + email + '$', 'i');
    const user = await User.findOne({ email: emailRegex });
    
    if (!user) {
      if (email.includes('admin') || email.includes('teacher') || email.includes('student')) {
        return res.json({ message: 'Password reset successfully (DEMO FALLBACK).' });
      }
      return res.status(404).json({ message: 'User not found' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetDemo = async (req, res) => {
  try {
    console.log("Resetting demo database...");
    await seedDatabase();
    res.json({ message: 'Demo database has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// server.js — Production-ready entry point
// MongoDB Atlas ONLY. No fallback. No local DB.
// ============================================================

import dotenv from 'dotenv';
dotenv.config(); // MUST be first — loads .env before any other import uses env vars

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import seedDatabase from './seed.js';

import authRoutes from './routes/authRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

// Safe ENV check — confirms variable is loaded WITHOUT leaking the URI value
console.log('ENV loaded:', !!process.env.MONGO_URI);
console.log('NODE_ENV :', process.env.NODE_ENV || 'development');

// ── App + Middleware ─────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── HTTP Server + Socket.IO ──────────────────────────────────
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

global.io = io; // expose so controllers can emit events

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/quiz', quizRoutes);

// Health check — used by Render and monitoring tools
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbMode: 'atlas',
    env: process.env.NODE_ENV || 'development'
  });
});

// Admin: force wipe + re-seed (protected by ADMIN_SECRET)
app.post('/api/admin/reset-db', async (req, res) => {
  // Hardened security check
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    console.warn('⚠️ Unauthorized reset-db attempt');
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await seedDatabase(true);
    res.json({ success: true, message: '✅ DB reset and re-seeded successfully.' });
  } catch (err) {
    console.error('❌ reset-db error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── MongoDB Atlas Connection ─────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected (Atlas)");
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    process.exit(1);
  }
};

// ── Server Startup ───────────────────────────────────────────
const startServer = async () => {
  const PORT = process.env.PORT || 5000;

  // Step 1: Connect to Atlas (crashes if it fails)
  await connectDB();

  // Step 2: Seed ONLY in non-production environments
  if (process.env.NODE_ENV !== "production") {
    await seedDatabase(false);
  }

  // Step 3: Start listening
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌐 Database : MongoDB Atlas`);
    console.log(`🏷️  Mode     : ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  });
};

startServer();

// ── Graceful Shutdown ────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await mongoose.disconnect();
  httpServer.close();
  console.log('✅ Server shut down cleanly.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await mongoose.disconnect();
  httpServer.close();
  console.log('✅ Server shut down cleanly.');
  process.exit(0);
});

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import seedDatabase from './seed.js';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server + Socket.IO
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Expose io globally so controllers can emit events
global.io = io;

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`❌ Socket disconnected: ${socket.id}`));
});

app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/quiz', quizRoutes);
// app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbMode: global.DB_MODE || 'unknown'
  });
});

// Reset Demo DB endpoint — wipes and re-seeds without restarting
app.post('/api/admin/reset-db', async (req, res) => {
  try {
    await seedDatabase(true); // force re-seed
    res.json({ success: true, message: '✅ Demo DB reset and re-seeded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

let mongoServer; // holds in-memory server reference if used

const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  const localUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillsync';

  // --- STEP 1: Try local MongoDB (Compass) ---
  let connected = false;
  try {
    console.log(`🔌 Attempting to connect to local MongoDB: ${localUri}`);
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB Connected (LOCAL — Compass mode)');
    global.DB_MODE = 'local';
    connected = true;
  } catch (localErr) {
    console.warn('⚠️  Local MongoDB not available:', localErr.message);
    console.warn('   💡 To use MongoDB Compass, install MongoDB Community:');
    console.warn('      https://www.mongodb.com/try/download/community');
    console.warn('   ↩️  Falling back to In-Memory MongoDB...\n');
  }

  // --- STEP 2: Fallback to in-memory MongoDB ---
  if (!connected) {
    try {
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log('✅ MongoDB Connected (IN-MEMORY — demo mode, data resets on restart)');
      global.DB_MODE = 'memory';
    } catch (memErr) {
      console.error('❌ Fatal: Could not start in-memory MongoDB either:', memErr.message);
      process.exit(1);
    }
  }

  // --- STEP 3: Seed the database ---
  await seedDatabase(false);

  // --- STEP 4: Start HTTP server ---
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📦 Database mode: ${global.DB_MODE === 'local' ? '🟢 LOCAL (MongoDB Compass)' : '🟡 IN-MEMORY (ephemeral)'}`);
    if (global.DB_MODE === 'local') {
      console.log(`🔗 View data in Compass: mongodb://127.0.0.1:27017/skillsync`);
    } else {
      console.log(`   ℹ️  Data is temporary. Install MongoDB to persist data.`);
    }
    console.log('');
  });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  httpServer.close();
  console.log('\n🛑 Server shut down cleanly.');
  process.exit();
});

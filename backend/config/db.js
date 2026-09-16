const mongoose = require('mongoose');

// Disable buffering so queries don't hang if DB is disconnected
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (mongoUri) {
      const conn = await mongoose.connect(mongoUri);
      console.log(`[MongoDB Cloud Connected] Host: ${conn.connection.host}`);
      return;
    }

    if (!process.env.VERCEL) {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/esports_db', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[MongoDB Local Connected] Host: ${conn.connection.host}`);
      return;
    }
  } catch (error) {
    console.warn(`[MongoDB Connection Warning]: ${error.message}`);

    if (!process.env.VERCEL) {
      console.log('[MongoDB Fallback]: Initializing MongoMemoryServer...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        
        await mongoose.connect(uri);
        console.log(`[MongoDB In-Memory Connected] URI: ${uri}`);
        await seedInMemoryDB();
      } catch (memError) {
        console.error('[MongoDB Error]: Memory DB startup failed:', memError.message);
      }
    }
  }
};

async function seedInMemoryDB() {
  try {
    const User = require('../models/User');
    const Tournament = require('../models/Tournament');
    const Team = require('../models/Team');
    const TournamentRegistration = require('../models/TournamentRegistration');

    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[Auto-Seed] Populating initial Admin, Users & Tournaments...');

      const admin = await User.create({
        name: 'Gopal Yadav (Admin)',
        username: 'gopal',
        email: 'gopal.x235@gmail.com',
        phone: '9876543210',
        password: 'admin123password',
        role: 'ADMIN',
      });

      const user1 = await User.create({
        name: 'John Warrior',
        username: 'john_warrior',
        email: 'john@example.com',
        phone: '9876543211',
        password: 'user123password',
        role: 'USER',
      });

      const team1 = await Team.create({
        name: 'Cyber Warriors',
        game: 'BGMI',
        captain: user1._id,
        members: [{ user: user1._id, inGameId: '512345678', inGameUsername: 'War_John' }],
      });

      const tourney1 = await Tournament.create({
        title: 'BGMI India Masters Championship 2026',
        game: 'BGMI',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        format: 'Squad',
        teamSize: 4,
        maxTeams: 16,
        registeredTeamsCount: 1,
        entryFee: 100,
        prizePool: 50000,
        description: 'The ultimate battleground tournament for top BGMI squads.',
        rules: '1. Device: Mobile only.\n2. Emulator not allowed.',
        organizer: 'Nexus Esports Official',
        status: 'REGISTRATION_OPEN',
        registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });

      await Tournament.create({
        title: 'Valorant Cyber Clash Pro',
        game: 'Valorant',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        format: '5v5',
        teamSize: 5,
        maxTeams: 8,
        registeredTeamsCount: 0,
        entryFee: 250,
        prizePool: 75000,
        description: '5v5 Tactical Shooter Showdown.',
        rules: '1. Standard competitive map pool.',
        organizer: 'Nexus Esports Official',
        status: 'REGISTRATION_OPEN',
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });

      await Tournament.create({
        title: 'Free Fire Survival Showdown',
        game: 'Free Fire',
        banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
        format: 'Squad',
        teamSize: 4,
        maxTeams: 24,
        registeredTeamsCount: 0,
        entryFee: 0,
        prizePool: 10000,
        description: 'Free entry survival tournament for all Free Fire contenders.',
        rules: '1. Squad mode.',
        organizer: 'Nexus Community',
        status: 'REGISTRATION_OPEN',
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      });

      await TournamentRegistration.create({
        registrationId: 'REG-1001-SEED',
        tournament: tourney1._id,
        team: team1._id,
        captain: user1._id,
        paymentStatus: 'SUCCESS',
      });

      console.log('[Auto-Seed] In-Memory Database Seeded Successfully!');
    }
  } catch (err) {
    console.error('[Auto-Seed Error]:', err.message);
  }
}

module.exports = connectDB;

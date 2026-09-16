const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const TournamentRegistration = require('../models/TournamentRegistration');
const Match = require('../models/Match');
const Leaderboard = require('../models/Leaderboard');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing database records...');
    await User.deleteMany();
    await Tournament.deleteMany();
    await Team.deleteMany();
    await TournamentRegistration.deleteMany();
    await Match.deleteMany();
    await Leaderboard.deleteMany();

    console.log('[Seed] Creating Sole Admin (gopal.x235@gmail.com) & Users...');
    const admin = await User.create({
      name: 'Gopal Yadav (Admin)',
      username: 'gopal',
      email: 'gopal.x235@gmail.com',
      phone: '9876543210',
      password: 'admin123password',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    });

    const user1 = await User.create({
      name: 'John Warrior',
      username: 'john_warrior',
      email: 'john@example.com',
      phone: '9876543211',
      password: 'user123password',
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
    });

    const user2 = await User.create({
      name: 'Alex Striker',
      username: 'alex_striker',
      email: 'alex@example.com',
      phone: '9876543212',
      password: 'user123password',
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&auto=format&fit=crop&q=80',
    });

    console.log('[Seed] Creating sample teams...');
    const team1 = await Team.create({
      name: 'Cyber Warriors',
      game: 'BGMI',
      captain: user1._id,
      logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      members: [
        { user: user1._id, inGameId: '512345678', inGameUsername: 'War_John' },
      ],
    });

    const team2 = await Team.create({
      name: 'Phoenix Knights',
      game: 'Valorant',
      captain: user2._id,
      logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80',
      members: [
        { user: user2._id, inGameId: 'Alex#1337', inGameUsername: 'Strik3r' },
      ],
    });

    console.log('[Seed] Creating sample tournaments...');
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
      description: 'The ultimate battleground tournament for top BGMI squads. Compete across Erangel, Miramar and Sanhok.',
      rules: '1. Device: Mobile only.\n2. Emulator not allowed.\n3. Team must join room 10 minutes prior.',
      organizer: 'Gopal Yadav (Nexus Admin)',
      status: 'REGISTRATION_OPEN',
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });

    const tourney2 = await Tournament.create({
      title: 'Valorant Cyber Clash Pro',
      game: 'Valorant',
      banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      format: '5v5',
      teamSize: 5,
      maxTeams: 8,
      registeredTeamsCount: 1,
      entryFee: 250,
      prizePool: 75000,
      description: '5v5 Tactical Shooter Showdown. Best of 3 single elimination bracket.',
      rules: '1. Standard competitive map pool.\n2. Overtime active.\n3. Screengrab of scores mandatory.',
      organizer: 'Gopal Yadav (Nexus Admin)',
      status: 'REGISTRATION_OPEN',
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    });

    const tourney3 = await Tournament.create({
      title: 'Free Fire Survival Showdown',
      game: 'Free Fire',
      banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
      format: 'Squad',
      teamSize: 4,
      maxTeams: 24,
      registeredTeamsCount: 0,
      entryFee: 0,
      prizePool: 10000,
      description: 'Free entry survival tournament for all aspiring Free Fire contenders.',
      rules: '1. Squad mode.\n2. No hacking plugins allowed.',
      organizer: 'Nexus Community',
      status: 'REGISTRATION_OPEN',
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Registering sample team to tournament...');
    await TournamentRegistration.create({
      registrationId: 'REG-1001-SEED',
      tournament: tourney1._id,
      team: team1._id,
      captain: user1._id,
      paymentStatus: 'SUCCESS',
    });

    console.log('[Seed] Creating sample match...');
    await Match.create({
      tournament: tourney1._id,
      roundName: 'Quarter Finals - Match 1',
      matchNumber: 1,
      teams: [team1._id],
      matchTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      roomId: '9845120',
      roomPassword: 'NEXUS',
      isPublished: true,
      status: 'SCHEDULED',
    });

    console.log('[Seed] Creating sample leaderboard...');
    await Leaderboard.create({
      tournament: tourney1._id,
      team: team1._id,
      rank: 1,
      matchesPlayed: 1,
      wins: 1,
      kills: 14,
      points: 29,
      prizeWon: 0,
    });

    console.log('================================================');
    console.log('✅ Seed Completed Successfully!');
    console.log('🔑 Sole Admin Credentials: email: gopal.x235@gmail.com | pass: admin123password');
    console.log('🔑 Gamer User Credentials: email: john@example.com | pass: user123password');
    console.log('================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();

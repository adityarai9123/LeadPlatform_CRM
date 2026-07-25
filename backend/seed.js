// Seeds one admin and one member account for grading/demo purposes.
// Run with: npm run seed  (requires MONGO_URI in .env)
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const run = async () => {
  await connectDB();

  await User.deleteMany({ email: { $in: ['admin@leadplatform.dev', 'member@leadplatform.dev'] } });

  await User.create([
    { name: 'Admin User', email: 'admin@leadplatform.dev', password: 'Admin@1234', role: 'admin' },
    { name: 'Sales Member', email: 'member@leadplatform.dev', password: 'Member@1234', role: 'member' },
  ]);

  console.log('Seeded demo users:');
  console.log('  admin@leadplatform.dev / Admin@1234');
  console.log('  member@leadplatform.dev / Member@1234');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

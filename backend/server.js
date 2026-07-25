require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module && process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`)))
    .catch((err) => {
      console.error('Failed to connect to DB', err);
      process.exit(1);
    });
}

module.exports = app;

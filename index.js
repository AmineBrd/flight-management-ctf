const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/flights', flightRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    const flightsPath = path.join(__dirname, 'data/flights/flights.json');
    const flightsRaw = await fs.readFile(flightsPath, 'utf8');
    const flights = JSON.parse(flightsRaw);

    res.render('index', { 
      title: 'Flight System',
      flights 
    });
  } catch (error) {
    console.error('Error loading flights for homepage:', error);
    res.render('index', { 
      title: 'Flight System',
      flights: [] 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


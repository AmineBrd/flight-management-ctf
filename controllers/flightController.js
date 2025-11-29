const fs = require('fs').promises;
const path = require('path');

// Helper function to read flights
const getFlights = async () => {
  const flightsPath = path.join(__dirname, '../data/flights/flights.json');
  const data = await fs.readFile(flightsPath, 'utf8');
  return JSON.parse(data);
};

// Helper function to save flights
const saveFlights = async (flights) => {
  const flightsPath = path.join(__dirname, '../data/flights/flights.json');
  await fs.writeFile(flightsPath, JSON.stringify(flights, null, 2));
};

// Get all flights (user view)
const getAllFlights = async (req, res) => {
  try {
    const flights = await getFlights();
    res.render('pages/user/flights', { 
      flights,
      user: req.user,
      title: 'Available Flights'
    });
  } catch (error) {
    res.render('error', { 
      message: 'Error fetching flights',
      title: 'Error'
    });
  }
};

// Get all flights (admin view)
const getAllFlightsAdmin = async (req, res) => {
  try {
    const flights = await getFlights();
    res.render('pages/admin/flights', { 
      flights,
      user: req.user,
      title: 'Flight Management - Admin'
    });
  } catch (error) {
    res.render('error', { 
      message: 'Error fetching flights',
      title: 'Error'
    });
  }
};

// Get flight by ID (user view)
const getFlightById = async (req, res) => {
  try {
    const flights = await getFlights();
    const flight = flights.find(f => f.id === parseInt(req.params.id));
    
    if (!flight) {
      return res.render('error', { 
        message: 'Flight not found',
        title: 'Error'
      });
    }
    
    res.render('flights/detail', { 
      flight,
      user: req.user,
      title: `Flight ${flight.flightNumber}`,
      backUrl: '/flights'
    });
  } catch (error) {
    res.render('error', { 
      message: 'Error fetching flight',
      title: 'Error'
    });
  }
};

// Get flight by ID (admin view)
const getFlightByIdAdmin = async (req, res) => {
  try {
    const flights = await getFlights();
    const flight = flights.find(f => f.id === parseInt(req.params.id));
    
    if (!flight) {
      return res.render('error', { 
        message: 'Flight not found',
        title: 'Error'
      });
    }
    
    res.render('flights/detail', { 
      flight,
      user: req.user,
      title: `Flight ${flight.flightNumber} - Admin`,
      backUrl: '/admin/flights'
    });
  } catch (error) {
    res.render('error', { 
      message: 'Error fetching flight',
      title: 'Error'
    });
  }
};

// Create new flight
const createFlight = async (req, res) => {
  try {
    const { flightNumber, origin, destination, departureTime, arrivalTime, price, seats } = req.body;

    if (!flightNumber || !origin || !destination || !departureTime || !arrivalTime || !price) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const flights = await getFlights();
    
    const newFlight = {
      id: flights.length > 0 ? Math.max(...flights.map(f => f.id)) + 1 : 1,
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      price: parseFloat(price),
      seats: seats ? parseInt(seats) : 100,
      availableSeats: seats ? parseInt(seats) : 100,
      createdAt: new Date().toISOString()
    };

    flights.push(newFlight);
    await saveFlights(flights);

    res.redirect('/admin/flights');
  } catch (error) {
    res.status(500).json({ error: 'Error creating flight' });
  }
};

// Update flight
const updateFlight = async (req, res) => {
  try {
    const flights = await getFlights();
    const flightIndex = flights.findIndex(f => f.id === parseInt(req.params.id));

    if (flightIndex === -1) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    const { flightNumber, origin, destination, departureTime, arrivalTime, price, seats } = req.body;

    flights[flightIndex] = {
      ...flights[flightIndex],
      flightNumber: flightNumber || flights[flightIndex].flightNumber,
      origin: origin || flights[flightIndex].origin,
      destination: destination || flights[flightIndex].destination,
      departureTime: departureTime || flights[flightIndex].departureTime,
      arrivalTime: arrivalTime || flights[flightIndex].arrivalTime,
      price: price ? parseFloat(price) : flights[flightIndex].price,
      seats: seats ? parseInt(seats) : flights[flightIndex].seats,
      updatedAt: new Date().toISOString()
    };

    await saveFlights(flights);
    res.redirect('/admin/flights');
  } catch (error) {
    res.status(500).json({ error: 'Error updating flight' });
  }
};

// Delete flight
const deleteFlight = async (req, res) => {
  try {
    const flights = await getFlights();
    const filteredFlights = flights.filter(f => f.id !== parseInt(req.params.id));

    if (flights.length === filteredFlights.length) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    await saveFlights(filteredFlights);
    res.redirect('/admin/flights');
  } catch (error) {
    res.status(500).json({ error: 'Error deleting flight' });
  }
};

module.exports = {
  getAllFlights,
  getAllFlightsAdmin,
  getFlightById,
  getFlightByIdAdmin,
  createFlight,
  updateFlight,
  deleteFlight
};


# Flight Management System

A minimal backend system for managing flights with JWT authentication and EJS views.

## Features

- JWT-based authentication
- User registration and login
- Role-based access control (Admin/User)
- Flight management (CRUD operations)
- EJS templating for views
- File-based data storage (no database)

## Project Structure

```
├── controllers/       # Business logic
│   ├── authController.js
│   └── flightController.js
├── middleware/        # Authentication middleware
│   └── authMiddleware.js
├── routes/            # Route definitions
│   ├── authRoutes.js
│   └── flightRoutes.js
├── views/             # EJS templates
│   ├── flights/
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   └── error.ejs
├── data/              # Data storage (JSON files)
│   ├── users/
│   │   └── users.json
│   └── flights/
│       └── flights.json
├── public/            # Static files
│   ├── css/
│   │   └── style.css
│   └── js/
└── index.js           # Main server file
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the JWT_SECRET in `.env` file with a secure random string.

## Usage

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Default Admin Account

You can create an admin account through the registration page, or manually add one to `data/users/users.json`.

**Note:** The default password hash in the sample data is a placeholder. You should register a new admin account through the web interface.

## API Routes

### Authentication
- `GET /auth/login` - Login page
- `POST /auth/login` - Login user
- `GET /auth/register` - Registration page
- `POST /auth/register` - Register new user
- `GET /auth/logout` - Logout user

### Flights (Protected - requires authentication)
- `GET /flights` - List all flights
- `GET /flights/:id` - Get flight details
- `POST /flights` - Create new flight (Admin only)
- `PUT /flights/:id` - Update flight (Admin only)
- `DELETE /flights/:id` - Delete flight (Admin only)

## Data Storage

All data is stored in JSON files within the `data/` directory:
- `data/users/users.json` - User accounts
- `data/flights/flights.json` - Flight information

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are stored in HTTP-only cookies
- Admin routes are protected with role-based middleware
- Remember to change the JWT_SECRET in production


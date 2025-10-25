# Fresh Flow Store Backend API

A comprehensive backend API for the Fresh Flow Store supermarket management system, built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: Complete CRUD operations for user accounts
- 🛡️ **Security**: Password hashing, rate limiting, CORS protection, and input validation
- 📊 **User Statistics**: Analytics and reporting for user management
- 🚀 **Performance**: Optimized database queries with pagination and indexing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator
- **Environment**: dotenv

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fresh-flow-store/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config.env.example config.env
   ```
   
   Edit `config.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fresh-flow-store
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Create default admin user**
   ```bash
   npm run create-admin
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Login user | Public |
| POST | `/logout` | Logout user | Private |
| GET | `/me` | Get current user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change user password | Private |

### User Management Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users (paginated) | Admin/Manager |
| GET | `/:id` | Get user by ID | Admin/Manager/Owner |
| POST | `/` | Create new user | Admin |
| PUT | `/:id` | Update user | Admin/Owner |
| DELETE | `/:id` | Deactivate user | Admin |
| PUT | `/:id/activate` | Activate user | Admin |
| GET | `/stats/overview` | Get user statistics | Admin/Manager |

## User Roles

- **admin**: Full system access
- **manager**: User management and reporting access
- **employee**: Basic system access
- **cashier**: Limited access for billing operations

## Database Schema

### User Model

```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'manager', 'employee', 'cashier']),
  department: String (enum: ['management', 'sales', 'inventory', 'billing', 'reports']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  profileImage: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    theme: String (enum: ['light', 'dark', 'system']),
    language: String,
    notifications: {
      email: Boolean,
      push: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Password Hashing**: Uses bcryptjs with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **Helmet**: Security headers for Express
- **Role-based Access Control**: Granular permission system

## Error Handling

The API uses consistent error response format:

```javascript
{
  status: 'error',
  message: 'Error description',
  errors: [] // Validation errors (if applicable)
}
```

## Success Response Format

```javascript
{
  status: 'success',
  message: 'Operation successful',
  data: {
    // Response data
  }
}
```

## Development

### Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run create-admin`: Create default admin user

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/fresh-flow-store` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |

## Testing

You can test the API using tools like Postman, curl, or any HTTP client. Here are some example requests:

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "employee",
    "department": "sales"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@supermart.com",
    "password": "admin123"
  }'
```

### Get user profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure proper MongoDB connection string
4. Set up reverse proxy (nginx)
5. Use PM2 or similar process manager
6. Enable HTTPS
7. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

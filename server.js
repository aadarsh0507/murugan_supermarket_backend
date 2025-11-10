import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
// import categoryRoutes from './routes/categories.js';
// import itemRoutes from './routes/items.js';
import billRoutes from './routes/bills.js';
import supplierRoutes from './routes/suppliers.js';
// import purchaseOrderRoutes from './routes/purchaseOrders.js';
// import barcodeRoutes from './routes/barcodes.js';
import dashboardRoutes from './routes/dashboard.js';
// import creditRoutes from './routes/credits.js';
// import customerCreditRoutes from './routes/customerCredits.js';
import roleRoutes from './routes/roles.js';
import departmentRoutes from './routes/departments.js';
import pool, { query } from './db/index.js';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware (gzip/brotli)
app.use(compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// ETag middleware for caching
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    const dataString = JSON.stringify(data);
    const etag = crypto.createHash('md5').update(dataString).digest('hex');
    res.set('ETag', `"${etag}"`);

    if (req.headers['if-none-match'] === `"${etag}"`) {
      return res.status(304).end();
    }

    return originalJson.call(this, data);
  };
  next();
});

// Rate limiting

// CORS configuration - permissive for development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
}));

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const verifyDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [info] = await connection.query('SELECT DATABASE() AS db');
    await connection.ping();
    connection.release();
    console.log(`✅ Connected to MySQL${info[0]?.db ? ` (database: ${info[0].db})` : ''}`);
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    console.log('\n📋 Please verify that your MySQL server is running and MYSQL_URL is set in the .env file.');
    process.exit(1);
  }
};

await verifyDatabaseConnection();


// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
// The following routes are temporarily disabled for isolated auth testing:
app.use('/api/users', userRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/items', itemRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/suppliers', supplierRoutes);
// app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/barcodes', barcodeRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/credits', creditRoutes);
// app.use('/api/customer-credits', customerCreditRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1 AS healthy');
    res.status(200).json({
      status: 'success',
      message: 'Fresh Flow Store API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const [connection] = await pool.query('SELECT DATABASE() AS db, CONNECTION_ID() AS connectionId');
    res.json({
      status: 'success',
      metrics: {
        uptime: process.uptime(),
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        database: {
          connectionId: connection?.connectionId || null,
          database: connection?.db || null
        },
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Fresh Flow Store API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    },
    documentation: 'API documentation available at /api/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

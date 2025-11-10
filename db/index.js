import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mysqlUrl = process.env.MYSQL_URL;

if (!mysqlUrl) {
  throw new Error('MYSQL_URL is not defined in environment variables');
}

const url = new URL(mysqlUrl);
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, '')) || undefined;
const baseConnectionConfig = {
  host: url.hostname,
  port: url.port ? Number(url.port) : undefined,
  user: url.username ? decodeURIComponent(url.username) : undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined
};

const sslParam = url.searchParams.get('ssl');
if (sslParam && !['0', 'false', 'no'].includes(sslParam.toLowerCase())) {
  baseConnectionConfig.ssl = { rejectUnauthorized: false };
}

const ensureDatabaseExists = async () => {
  if (!databaseName) {
    return;
  }

  const connection = await mysql.createConnection(baseConnectionConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await connection.end();
  }
};

await ensureDatabaseExists();

const sequelizeOptions = {
  dialect: 'mysql',
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
  dialectOptions: baseConnectionConfig.ssl ? { ssl: baseConnectionConfig.ssl } : undefined,
  define: {
    underscored: true
  },
  pool: {
    max: parseInt(process.env.SEQUELIZE_POOL_MAX || process.env.MYSQL_POOL_LIMIT || '10', 10),
    min: parseInt(process.env.SEQUELIZE_POOL_MIN || '0', 10),
    idle: parseInt(process.env.SEQUELIZE_POOL_IDLE || process.env.MYSQL_POOL_IDLE_TIMEOUT || '10000', 10),
    acquire: parseInt(process.env.SEQUELIZE_POOL_ACQUIRE || '30000', 10)
  }
};

const sequelize = new Sequelize(mysqlUrl, sequelizeOptions);

await sequelize.authenticate();

const pool = mysql.createPool({
  ...baseConnectionConfig,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.MYSQL_POOL_LIMIT || '10', 10),
  maxIdle: parseInt(process.env.MYSQL_POOL_MAX_IDLE || '5', 10),
  idleTimeout: parseInt(process.env.MYSQL_POOL_IDLE_TIMEOUT || '60000', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const getConnection = async () => {
  return pool.getConnection();
};

export const query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
export { sequelize };

import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiBasePath: process.env.API_BASE_PATH || '/api/v1',
  databaseUrl: '',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
   jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_key',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
    snsOtpSenderId: process.env.AWS_SNS_OTP_SENDER_ID,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  passwordReset:{
    tokenExpiresInMinutes: 30
  }
};

// Validate essential configurations
if (config.env !== 'test' && !config.jwt.secret.startsWith('your_very_strong_jwt_secret_key')) {
    if (config.jwt.secret === 'fallback_secret_key') {
        console.warn(
            'WARNING: JWT_SECRET is not set or is using the fallback. Please set a strong secret in your .env file for production.'
        );
    }
}
if (config.env === 'production' && (!config.database.user || !config.database.password)) {
    console.error('FATAL ERROR: Database credentials are not set for production environment.');
    process.exit(1);
}

// Construct DATABASE_URL if not already set directly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}?schema=public`;
}
console.log(process.env.DATABASE_URL)

export default config;

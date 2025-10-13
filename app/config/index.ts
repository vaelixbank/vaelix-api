import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

interface Config {
  port: number;
  nodeEnv: string;
  weavr: {
    baseUrl: string;
    apiKey?: string;
  };
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  security: {
    helmet: boolean;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  weavr: {
    baseUrl: process.env.WEAVR_API_BASE_URL || 'https://sandbox.weavr.io',
    apiKey: process.env.WEAVR_API_KEY,
  },
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
  },
  cors: {
    origins: process.env.NODE_ENV === 'production'
      ? ['https://api.vaelixbank.com', 'https://vaelixbank.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  security: {
    helmet: true,
  },
};

export default config;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  weavr: {
    baseUrl: string;
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
    baseUrl: process.env.WEAVR_API_BASE_URL || 'https://api.weavr.io',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'vaelixbank',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
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
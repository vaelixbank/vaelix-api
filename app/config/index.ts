import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  weavr: {
    baseUrl: string;
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
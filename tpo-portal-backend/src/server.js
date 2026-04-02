const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generalRateLimiter } = require('./utils/rateLimiter');
const { buildContext } = require('./middleware/auth');
const { logSystem } = require('./utils/logger');
const schema = require('./graphql/schema');
require('dotenv').config();

async function startServer() {
  const app = express();

  // Health check endpoint (must be before Apollo middleware)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Skip rate limiting for OPTIONS requests (CORS preflight)
  app.use('/graphql', (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    return generalRateLimiter(req, res, next);
  });

  // Initialize Apollo Server
  const server = new ApolloServer({
    schema,
    // Format errors for better client experience
    formatError: (formattedError) => {
      const { message, extensions } = formattedError;

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production' && extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR'
        };
      }

      return {
        message,
        code: extensions?.code || 'GRAPHQL_ERROR'
      };
    }
  });

  await server.start();

  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173').split(',');
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or Docker)
      if (!origin) return callback(null, true);
      // Allow requests from allowed origins
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(
    '/graphql',
    cors(corsOptions),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        return buildContext(req);
      }
    })
  );

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    logSystem.startup();
    console.log(`🚀 Server running on http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logSystem.shutdown();
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logSystem.shutdown();
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });

  return app;
}

module.exports = startServer;

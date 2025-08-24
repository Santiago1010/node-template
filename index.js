// --------------------------- CORE NODE.JS DEPENDENCIES --------------------------- //
const http = require('http');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const debug = require('debug');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const app = require('./app');
const config = require('./config/env');

// --------------------------- DEBUG SETUP ---------------------------- //
const debugServer = debug('app:server');

// --------------------------- STARTUP TIME TRACKING ---------------------------- //
const startTime = process.hrtime.bigint();

// --------------------------- HELPER FUNCTIONS ---------------------------- //
const normalizePort = (val) => {
  const portNumber = parseInt(val, 10);

  if (isNaN(portNumber)) {
    return val;
  }

  if (portNumber >= 0) {
    return portNumber;
  }

  return false;
};

const formatStartupTime = (nanoseconds) => {
  const milliseconds = Number(nanoseconds) / 1_000_000;

  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(2)}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}m ${remainingSeconds}s`;
};

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();

  if (!addr) {
    console.error('Server address is not available.');
    process.exit(1);
  }

  // Calcular tiempo de arranque
  const endTime = process.hrtime.bigint();
  const startupTime = endTime - startTime;
  const formattedTime = formatStartupTime(startupTime);

  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  debugServer(`Listening on ${bind}`);
  debugServer(`Server startup time: ${formattedTime}`);

  console.log(`Server running on ${bind}`);
  console.log(`🚀 Server started in ${formattedTime}`);

  // swaggerDocs(app, port);
};

// --------------------------- SERVER SETUP ---------------------------- //
const port = normalizePort(config.port || '3000');
app.set('port', port);

const server = http.createServer(app);

// --------------------------- START SERVER ---------------------------- //
const startServer = async () => {
  try {
    console.log('🔄 Starting server...');

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

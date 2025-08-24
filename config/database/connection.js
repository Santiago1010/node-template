// --------------------------- CORE NODE.JS DEPENDENCIES --------------------------- //
// Built-in modules from Node.js
const { EventEmitter } = require('events');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
// Third-party libraries for additional functionality
const { DataTypes } = require('sequelize');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
// Project-specific modules and configurations
const config = require('../env');
const { createSequelizeInstance, testConnection, closeConnection } = require('./index');

// ----------------- DECLARATION OF VARIABLES AND CONSTANTS ----------------- //

/**
 * Database Connection Manager
 * Handles connection lifecycle, health checks, and reconnection logic
 */
class DatabaseConnection extends EventEmitter {
  constructor() {
    super();
    this.sequelize = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.healthCheckInterval = null;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      console.log('🔄 Initializing database connection...');

      this.sequelize = createSequelizeInstance();

      // Set up connection event listeners
      this.setupEventListeners();

      // Test initial connection
      const isConnected = await testConnection(this.sequelize);

      if (isConnected) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');

        // Start health check if in production
        if (config.mode === 'production') {
          this.startHealthCheck();
        }

        console.log('✅ Database initialized successfully');
        return this.sequelize;
      } else {
        throw new Error('Failed to establish database connection');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      this.emit('error', error);

      // Attempt reconnection
      await this.attemptReconnection();
      throw error;
    }
  }

  /**
   * Set up Sequelize event listeners
   */
  setupEventListeners() {
    if (!this.sequelize) return;

    // Connection established
    this.sequelize.connectionManager.on('connect', (connection) => {
      console.log('🔗 Database connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', connection);
    });

    // Connection lost
    this.sequelize.connectionManager.on('disconnect', (connection) => {
      console.warn('⚠️  Database connection lost');
      this.isConnected = false;
      this.emit('disconnected', connection);

      // Attempt reconnection
      this.attemptReconnection();
    });

    // Connection error
    this.sequelize.connectionManager.on('error', (error) => {
      console.error('❌ Database connection error:', error.message);
      this.isConnected = false;
      this.emit('error', error);
    });
  }

  /**
   * Attempt to reconnect to database
   */
  async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        const isConnected = await testConnection(this.sequelize);

        if (isConnected) {
          console.log('✅ Reconnection successful');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('reconnected');
        } else {
          await this.attemptReconnection();
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error.message);
        await this.attemptReconnection();
      }
    }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    const healthCheckInterval = 60000; // 1 minute

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.sequelize.authenticate();

        if (!this.isConnected) {
          console.log('✅ Database connection restored');
          this.isConnected = true;
          this.emit('healthCheckPassed');
        }
      } catch (error) {
        console.warn('⚠️  Database health check failed:', error.message);

        if (this.isConnected) {
          this.isConnected = false;
          this.emit('healthCheckFailed', error);
          await this.attemptReconnection();
        }
      }
    }, healthCheckInterval);

    console.log('🩺 Database health check started');
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 Database health check stopped');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasHealthCheck: !!this.healthCheckInterval,
      connectionState: this.sequelize?.connectionManager?.pool?.options?.host ? 'initialized' : 'not_initialized',
    };
  }

  /**
   * Execute a query with retry logic
   */
  async executeWithRetry(queryFn, maxRetries = 3) {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await queryFn(this.sequelize);
      } catch (error) {
        attempts++;

        if (attempts >= maxRetries) {
          console.error(`❌ Query failed after ${maxRetries} attempts:`, error.message);
          throw error;
        }

        console.warn(`⚠️  Query attempt ${attempts} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  /**
   * Gracefully close the database connection
   */
  async close() {
    console.log('🔄 Closing database connection...');

    // Stop health checks
    this.stopHealthCheck();

    // Close connection
    if (this.sequelize) {
      await closeConnection(this.sequelize);
      this.sequelize = null;
    }

    this.isConnected = false;
    this.emit('closed');

    console.log('✅ Database connection closed successfully');
  }

  /**
   * Get Sequelize instance
   */
  getInstance() {
    if (!this.sequelize) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sequelize;
  }

  /**
   * Sync database (development only)
   */
  async syncDatabase(options = {}) {
    if (config.mode === 'production') {
      console.warn('⚠️  Database sync is disabled in production. Use migrations instead.');
      return;
    }

    const defaultOptions = {
      force: false,
      alter: config.mode === 'development',
      logging: config.development.debug ? console.log : false,
    };

    const syncOptions = { ...defaultOptions, ...options };

    try {
      console.log('🔄 Syncing database...');
      await this.sequelize.sync(syncOptions);
      console.log('✅ Database sync completed');
    } catch (error) {
      console.error('❌ Database sync failed:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

// Export singleton instance and class
module.exports = databaseConnection;
module.exports.DatabaseConnection = DatabaseConnection;
module.exports.DataTypes = DataTypes;

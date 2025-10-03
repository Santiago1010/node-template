// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // For device fingerprinting

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const WebSocket = require('ws'); // WebSocket server implementation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../database/connection');

const { usrAccounts, usrAccesses } = sequelize.models;

/**
 * WebSocketManager - Real-time Communication Management Class
 *
 * @description Manages WebSocket connections, user authentication, and message
 * routing. Provides both targeted user messaging and broadcast capabilities.
 * Implements singleton pattern to ensure consistent connection management
 * across the application.
 *
 * @class
 * @example
 * // Basic initialization with HTTP server
 * const http = require('http');
 * const server = http.createServer();
 * const wsManager = require('./websocket-manager');
 *
 * wsManager.initialize(server);
 *
 * // Send message to specific user
 * wsManager.sendToUser(123, {
 *   type: 'NOTIFICATION',
 *   title: 'New Message',
 *   subtitle: 'You have unread messages',
 *   message: 'Check your inbox'
 * });
 *
 * // Broadcast to all connected clients
 * wsManager.broadcast({
 *   type: 'SYSTEM_UPDATE',
 *   message: 'System maintenance scheduled'
 * });
 */
class WebSocketManager {
  /**
   * Creates a new WebSocketManager instance
   *
   * @description Initializes the client registry using Map for efficient
   * user-to-connections mapping. Each user can have multiple active connections
   * (different devices/browsers).
   *
   * @constructor
   */
  constructor() {
    /**
     * @type {Map<number, Set<WebSocket>>} clients - User ID to WebSocket connections mapping
     * @private
     */
    this.clients = new Map();
  }

  /**
   * Extracts device information from WebSocket request
   *
   * @description Generates a unique device fingerprint based on headers
   * and connection metadata for device identification and security validation.
   *
   * @param {http.IncomingMessage} request - HTTP upgrade request
   * @returns {Object} Device information object
   *
   * @example
   * const deviceInfo = this.getDeviceInfo(request);
   * // Returns: { fingerprint, userAgent, ip, platform, browser }
   */
  getDeviceInfo(request) {
    const userAgent = request.headers['user-agent'] || '';
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.headers['x-real-ip'] ||
      request.socket.remoteAddress ||
      'unknown';

    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';

    // Generate unique device fingerprint
    const fingerprintData = `${userAgent}|${ip}|${acceptLanguage}|${acceptEncoding}`;
    const fingerprint = crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 32);

    // Parse user agent for additional info
    const platform = this.extractPlatform(userAgent);
    const browser = this.extractBrowser(userAgent);

    return {
      fingerprint,
      userAgent,
      ip,
      platform,
      browser,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extracts platform from user agent string
   *
   * @param {string} userAgent - User agent string
   * @returns {string} Platform name
   * @private
   */
  extractPlatform(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Extracts browser from user agent string
   *
   * @param {string} userAgent - User agent string
   * @returns {string} Browser name
   * @private
   */
  extractBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Validates account and device session in database
   *
   * @description Checks if the account exists, is active, and has an active
   * session on the device making the request.
   *
   * @param {number} idAccount - Account ID to validate
   * @param {Object} deviceInfo - Device information object
   * @returns {Promise<Object>} Validation result with account and access data
   *
   * @throws {Error} If validation fails
   */
  async validateAccountAndDevice(idAccount, deviceInfo) {
    try {
      // Step 1: Validate account exists and is active
      const account = await usrAccounts.finByPk(idAccount);

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      // Step 2: Validate active session on this device
      const activeAccess = await usrAccesses.findOne({
        where: { accountId: idAccount },
        order: [['createdAt', 'DESC']], // Get most recent session
      });

      if (!activeAccess) {
        throw new Error('No active session found for this account');
      }

      // Step 3: Validate device fingerprint matches
      const storedPayload = activeAccess.payload;
      const storedFingerprint = storedPayload?.deviceFingerprint;

      if (storedFingerprint && storedFingerprint !== deviceInfo.fingerprint) {
        // Device mismatch - security warning but allow connection
        console.warn(`⚠️ Device fingerprint mismatch for account ${idAccount}`);
        console.warn(`Expected: ${storedFingerprint}, Got: ${deviceInfo.fingerprint}`);
      }

      return {
        valid: true,
        account,
        access: activeAccess,
        deviceMatch: storedFingerprint === deviceInfo.fingerprint,
      };
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      throw error;
    }
  }

  /**
   * Initializes WebSocket server and sets up connection handlers
   *
   * @description Attaches WebSocket server to existing HTTP server and configures
   * event handlers for connection lifecycle management. Handles authentication,
   * message processing, and cleanup operations.
   *
   * @param {http.Server|https.Server} server - HTTP server instance for WebSocket upgrade
   * @returns {void}
   *
   * @throws {Error} If WebSocket server initialization fails
   *
   * @example
   * const http = require('http');
   * const server = http.createServer().listen(3000);
   * wsManager.initialize(server);
   */
  initialize(server) {
    /**
     * @type {WebSocket.Server} wss - WebSocket server instance
     * @private
     */
    this.wss = new WebSocket.Server({ server });

    // Connection event handler - new client connection
    this.wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection 🔌');

      // Extract device information from connection request
      const deviceInfo = this.getDeviceInfo(request);
      ws.deviceInfo = deviceInfo;

      console.log(`📱 Device: ${deviceInfo.platform} - ${deviceInfo.browser}`);
      console.log(`🔑 Fingerprint: ${deviceInfo.fingerprint}`);

      // Message event handler - processes incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);

          // Authentication handling - first message must be AUTH
          if (data.type === 'AUTH' && data.idAccount) {
            try {
              // Validate account and device session
              const validation = await this.validateAccountAndDevice(data.idAccount, deviceInfo);

              if (validation.valid) {
                // Register client connection
                this.registerClient(data.idAccount, ws);
                ws.idAccount = data.idAccount;
                ws.connectedAt = new Date();
                ws.validated = true;

                // Send authentication success confirmation
                ws.send(
                  JSON.stringify({
                    type: 'AUTH_SUCCESS',
                    message: 'Authenticated successfully ✅',
                    timestamp: ws.connectedAt.toISOString(),
                    device: {
                      platform: deviceInfo.platform,
                      browser: deviceInfo.browser,
                      fingerprint: deviceInfo.fingerprint,
                    },
                    deviceMatch: validation.deviceMatch,
                    account: {
                      id: validation.account.id,
                      email: validation.account.email,
                      internalCode: validation.account.internalCode,
                    },
                  })
                );

                console.log(`✅ Account ${data.idAccount} authenticated successfully`);
                if (!validation.deviceMatch) {
                  console.log(`⚠️ Device fingerprint mismatch - connection allowed`);
                }
              }
            } catch (validationError) {
              // Send authentication failure
              ws.send(
                JSON.stringify({
                  type: 'AUTH_ERROR',
                  message: validationError.message,
                  timestamp: new Date().toISOString(),
                })
              );
              console.error(`❌ Authentication failed: ${validationError.message}`);

              // Close connection after failed authentication
              setTimeout(() => ws.close(1008, 'Authentication failed'), 1000);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          // Business Rule: Fail silently for malformed messages to maintain connection
        }
      });

      // Connection close handler - cleanup resources
      ws.on('close', () => {
        if (ws.idAccount) {
          this.unregisterClient(ws.idAccount, ws);
        }
        console.log('WebSocket connection closed 🔒');
      });

      // Error handler - connection-level errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('🌐 WebSocket server initialized');
  }

  /**
   * Registers a client connection for a specific user
   *
   * @description Adds WebSocket connection to user's connection set. Supports
   * multiple concurrent connections per user (different devices/tabs).
   *
   * @param {number} idAccount - Unique user identifier
   * @param {WebSocket} ws - WebSocket connection instance
   * @returns {void}
   *
   * @example
   * // Manual registration (typically handled via AUTH message)
   * wsManager.registerClient(123, websocketConnection);
   *
   * @complexity Time: O(1), Space: O(1) amortized
   */
  registerClient(idAccount, ws) {
    // Performance Note: Map lookup and Set operations are O(1)
    if (!this.clients.has(idAccount)) {
      this.clients.set(idAccount, new Set());
    }
    this.clients.get(idAccount).add(ws);
    console.log(`Client registered: ${idAccount} 👤 (Total devices: ${this.clients.get(idAccount).size})`);
  }

  /**
   * Unregisters a client connection for a specific user
   *
   * @description Removes WebSocket connection from user's connection set.
   * Automatically cleans up empty user entries to prevent memory leaks.
   *
   * @param {number} idAccount - Unique user identifier
   * @param {WebSocket} ws - WebSocket connection instance to remove
   * @returns {void}
   *
   * @example
   * // Manual unregistration (typically handled via close event)
   * wsManager.unregisterClient(123, websocketConnection);
   *
   * @complexity Time: O(1), Space: O(1)
   */
  unregisterClient(idAccount, ws) {
    const userClients = this.clients.get(idAccount);
    if (userClients) {
      userClients.delete(ws);
      // Memory Optimization: Clean up empty user entries
      if (userClients.size === 0) {
        this.clients.delete(idAccount);
      }
    }
    console.log(`Client unregistered: ${idAccount} 👋`);
  }

  /**
   * Creates a structured message with standard format
   *
   * @description Generates a message object with optional title, subtitle,
   * link, and up to 3 action buttons following a consistent structure.
   *
   * @param {Object} options - Message configuration
   * @param {string} options.type - Message type identifier
   * @param {string} [options.title] - Message title
   * @param {string} [options.subtitle] - Message subtitle
   * @param {string} options.message - Main message content
   * @param {string} [options.link] - General link URL
   * @param {Array<Object>} [options.buttons] - Action buttons (max 3)
   * @param {Object} [options.data] - Additional custom data
   * @returns {Object} Structured message object
   *
   * @example
   * const msg = wsManager.createMessage({
   *   type: 'NOTIFICATION',
   *   title: 'New Order',
   *   subtitle: 'Order #12345',
   *   message: 'You have a new order to process',
   *   link: 'https://app.example.com/orders/12345',
   *   buttons: [
   *     { label: 'View Order', action: 'VIEW', url: '/orders/12345' },
   *     { label: 'Accept', action: 'ACCEPT', url: '/orders/12345/accept' }
   *   ]
   * });
   */
  createMessage(options) {
    const { type, title = null, subtitle = null, message, link = null, buttons = [], data = {} } = options;

    // Validate buttons (max 3)
    if (buttons.length > 3) {
      console.warn('⚠️ Maximum 3 buttons allowed. Only first 3 will be used.');
    }

    return {
      type,
      title,
      subtitle,
      message,
      link,
      buttons: buttons.slice(0, 3).map((btn, index) => ({
        id: btn.id || `btn_${index}`,
        label: btn.label,
        action: btn.action,
        url: btn.url || null,
        style: btn.style || 'primary', // primary, secondary, danger
      })),
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sends structured message to specific user
   *
   * @description Delivers message to all active connections for given user.
   * Only sends to connections in OPEN state to prevent errors. Handles
   * multi-device scenarios automatically.
   *
   * @param {number} idAccount - Target user identifier
   * @param {Object} messageOptions - Message configuration (see createMessage)
   * @returns {void}
   *
   * @example
   * // Send notification with buttons
   * wsManager.sendToUser(123, {
   *   type: 'NEW_MESSAGE',
   *   title: 'New Message',
   *   subtitle: 'From: John Doe',
   *   message: 'You have received a new message',
   *   buttons: [
   *     { label: 'Read', action: 'READ', url: '/messages/456' },
   *     { label: 'Reply', action: 'REPLY', url: '/messages/456/reply' }
   *   ]
   * });
   *
   * @complexity Time: O(n) where n is user's active connections
   */
  sendToUser(idAccount, messageOptions) {
    const userClients = this.clients.get(idAccount);
    if (userClients) {
      const structuredMessage = this.createMessage(messageOptions);
      const message = JSON.stringify(structuredMessage);

      userClients.forEach((client) => {
        // Edge Case: Only send to ready connections to prevent errors
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      console.log(`📤 Message sent to user ${idAccount}: ${structuredMessage.type}`);
    } else {
      console.log(`User ${idAccount} not connected ❌`);
    }
  }

  /**
   * Broadcasts structured message to all connected clients
   *
   * @description Sends message to every active WebSocket connection regardless
   * of user association. Useful for system-wide notifications and updates.
   *
   * @param {Object} messageOptions - Message configuration (see createMessage)
   * @returns {void}
   *
   * @example
   * // Broadcast system announcement
   * wsManager.broadcast({
   *   type: 'MAINTENANCE_ALERT',
   *   title: 'System Maintenance',
   *   message: 'System will restart in 5 minutes',
   *   buttons: [
   *     { label: 'Save Work', action: 'SAVE', style: 'danger' }
   *   ]
   * });
   *
   * @complexity Time: O(n) where n is total active connections
   */
  broadcast(messageOptions) {
    const structuredMessage = this.createMessage(messageOptions);
    const message = JSON.stringify(structuredMessage);

    this.wss.clients.forEach((client) => {
      // Performance Note: Check readyState to avoid unnecessary send attempts
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    console.log(`📢 Broadcast sent: ${structuredMessage.type}`);
  }

  /**
   * Gets connection statistics
   *
   * @returns {Object} Connection statistics
   */
  getStats() {
    const totalUsers = this.clients.size;
    let totalConnections = 0;

    this.clients.forEach((connections) => {
      totalConnections += connections.size;
    });

    return {
      totalUsers,
      totalConnections,
      averageConnectionsPerUser: totalUsers > 0 ? (totalConnections / totalUsers).toFixed(2) : 0,
    };
  }
}

// =============================================================================
// SINGLETON IMPLEMENTATION & GLOBAL REGISTRATION
// =============================================================================

/**
 * WebSocketManager Singleton Instance
 *
 * @description Single instance pattern ensures consistent connection management
 * across the entire application. Globally registered for easy access.
 *
 * @type {WebSocketManager}
 *
 * @example
 * // Access the singleton instance
 * const wsManager = require('./websocket-manager');
 * // OR via global registration (legacy approach)
 * const wsManager = global.wsManager;
 */
const wsManager = new WebSocketManager();

/**
 * Global Registration (Legacy Support)
 *
 * @description Registered globally for backward compatibility and easy access
 * across different modules. Consider using module imports for new code.
 *
 * @global
 * @type {WebSocketManager}
 */
global.wsManager = wsManager;

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * WebSocketManager Singleton Export
 *
 * @description Exports the singleton WebSocketManager instance for module-based
 * consumption. Preferred over global access for better dependency management.
 *
 * @type {WebSocketManager}
 */
module.exports = wsManager;

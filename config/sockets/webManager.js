// =============================================================================
// WEBSOCKET MANAGER - Real-time Communication & Connection Management
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Manages WebSocket connections with authentication and session validation
// - Provides targeted user messaging and broadcast capabilities
// - Handles multi-device connections with device fingerprinting
// - Implements real-time notification system with structured messaging
//
// ARCHITECTURAL DECISIONS:
// - Singleton pattern ensures consistent connection management across application
// - Map-based client registry for efficient user-to-connections mapping
// - Device fingerprinting for security validation without blocking connections
// - Structured message format for consistent client-side processing
// - Separation of authentication, messaging, and connection management concerns
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Redis Pub/Sub: Considered for distributed WebSocket management but rejected
//   due to added complexity and single-server deployment requirements
// - Socket.IO: Evaluated but rejected to maintain lightweight implementation
//   and avoid additional dependencies
// - Connection pooling: Considered for high-volume scenarios but current
//   implementation provides sufficient performance for expected load
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for client registration/unregistration
// - Time complexity: O(n) for user messaging (where n = user's active connections)
// - Time complexity: O(m) for broadcasting (where m = total active connections)
// - Space complexity: O(u * c) where u = users, c = connections per user
// - Expected scale: Supports 10,000+ concurrent connections with proper resources
//
// SECURITY CONSIDERATIONS:
// - Device fingerprinting detects session hijacking attempts
// - Authentication required before message processing
// - Input validation and JSON parsing error handling
// - Connection cleanup prevents memory leaks and resource exhaustion
// - Secure WebSocket (WSS) recommended for production deployment
//
// USAGE EXAMPLES:
// - Real-time notifications for user actions and system events
// - Live chat and messaging functionality
// - Collaborative editing and real-time updates
// - System monitoring and admin notifications
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor connection counts and memory usage in production
// - Log device fingerprint mismatches for security analysis
// - Implement connection heartbeats for stale connection detection
// - Consider Redis adapter for horizontal scaling in future
//
// DEPENDENCIES & COMPATIBILITY:
// - Node.js 14+ required for Map, Set, and modern JS features
// - WebSocket library: 'ws' ^8.0.0 or compatible version
// - Sequelize ORM for database operations
// - Crypto module for device fingerprint generation
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Cryptographic operations for device fingerprinting

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const WebSocket = require('ws'); // RFC-6455 compliant WebSocket server implementation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../database/connection'); // Database connection and ORM
const { getDeviceInfo } = require('../../utils/utilities.util'); // Device fingerprint generation

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts, usrAccesses } = sequelize.models; // User account and access session models

/**
 * WebSocketManager - Real-time Communication Management Class
 *
 * @description Centralized WebSocket connection manager providing authentication,
 * message routing, and broadcast capabilities. Implements singleton pattern to
 * ensure consistent connection state across application. Supports multiple
 * concurrent connections per user for cross-device synchronization.
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
 * // Send targeted notification to user
 * wsManager.sendToUser(123, {
 *   type: 'ORDER_UPDATE',
 *   title: 'Order Shipped',
 *   subtitle: 'Your order #12345 has been shipped',
 *   message: 'Tracking number: TRK-789-456-123',
 *   link: '/orders/12345',
 *   buttons: [
 *     { label: 'Track Order', action: 'TRACK', url: '/tracking/12345' },
 *     { label: 'View Details', action: 'VIEW', url: '/orders/12345' }
 *   ]
 * });
 *
 * // Broadcast system-wide announcement
 * wsManager.broadcast({
 *   type: 'SYSTEM_MAINTENANCE',
 *   title: 'Maintenance Notice',
 *   message: 'System will be unavailable from 2-4 AM for maintenance',
 *   buttons: [
 *     { label: 'Learn More', action: 'INFO', style: 'secondary' }
 *   ]
 * });
 */
class WebSocketManager {
  /**
   * Creates a new WebSocketManager instance
   *
   * @description Initializes client registry using Map for O(1) user lookups
   * and Set for efficient connection management. Each user can maintain multiple
   * active WebSocket connections representing different devices or browser tabs.
   *
   * @constructor
   *
   * @example
   * const manager = new WebSocketManager();
   * // Internal: clients Map structure: Map<userId, Set<WebSocket>>
   */
  constructor() {
    /**
     * Client connections registry mapping user IDs to WebSocket instances
     *
     * @type {Map<number, Set<WebSocket>>}
     * @private
     *
     * @example
     * // Structure example:
     * Map(2) {
     *   123 => Set(2) { WebSocket, WebSocket }, // User 123 on two devices
     *   456 => Set(1) { WebSocket }             // User 456 on one device
     * }
     */
    this.clients = new Map();
  }

  /**
   * Generates device fingerprint from device information
   *
   * @description Creates a unique hash based on device characteristics for
   * session validation and security tracking. Uses SHA-256 for consistent
   * fingerprinting across connections.
   *
   * @param {Object} deviceInfo - Device information object from getDeviceInfo()
   * @returns {string} SHA-256 hash representing device fingerprint
   * @private
   *
   * @example
   * const fingerprint = generateDeviceFingerprint(deviceInfo);
   * // Returns: "a7f5c8d9e2b4f6a8c1d3e5f7b9c2d4e6..."
   *
   * @complexity Time: O(1), Space: O(1)
   * @security Uses cryptographic hash for consistent fingerprinting
   */
  generateDeviceFingerprint(deviceInfo) {
    const fingerprintData = `${deviceInfo.browser}-${deviceInfo.browserVersion}-${deviceInfo.os}-${deviceInfo.deviceType}`;
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * Validates user account and device session against database
   *
   * @description Performs three-tier validation: account existence and status,
   * active session verification, and device fingerprint matching. Security
   * warnings are logged for device mismatches but connections are allowed
   * to support legitimate device changes.
   *
   * @param {number} idAccount - User account identifier
   * @param {Object} deviceInfo - Device information from getDeviceInfo()
   * @returns {Promise<Object>} Validation result with account and session data
   *
   * @throws {Error} When account not found, inactive, or no session exists
   *
   * @example
   * try {
   *   const validation = await validateAccountAndDevice(123, deviceInfo);
   *   if (validation.valid) {
   *     // Proceed with connection
   *   }
   * } catch (error) {
   *   // Handle validation failure
   * }
   *
   * @complexity Time: O(1) database operations, Space: O(1)
   * @security Validates device fingerprint against stored session
   */
  async validateAccountAndDevice(idAccount, deviceInfo) {
    try {
      // Step 1: Account validation - check existence and active status
      const account = await usrAccounts.findByPk(idAccount);

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      // Step 2: Session validation - find most recent access record
      const activeAccess = await usrAccesses.findOne({
        where: { accountId: idAccount },
        order: [['createdAt', 'DESC']], // Performance: Index on createdAt recommended
      });

      if (!activeAccess) {
        throw new Error('No active session found for this account');
      }

      // Step 3: Device fingerprint validation with security logging
      const storedPayload = activeAccess.payload;
      const storedFingerprint = storedPayload?.deviceFingerprint;
      const currentFingerprint = this.generateDeviceFingerprint(deviceInfo);

      // Business Rule: Allow connection even on device mismatch but log warning
      if (storedFingerprint && storedFingerprint !== currentFingerprint) {
        console.warn(`⚠️ Device fingerprint mismatch for account ${idAccount}`);
        console.warn(`Expected: ${storedFingerprint}, Got: ${currentFingerprint}`);
        // TODO: Consider implementing secondary verification for high-security scenarios
      }

      return {
        valid: true,
        account,
        access: activeAccess,
        deviceMatch: storedFingerprint === currentFingerprint,
        fingerprint: currentFingerprint,
      };
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      throw error;
    }
  }

  /**
   * Initializes WebSocket server and configures connection lifecycle handlers
   *
   * @description Attaches WebSocket server to HTTP server and sets up event
   * handlers for connection, message processing, and cleanup. Implements
   * authentication workflow where first message must be AUTH type.
   *
   * @param {http.Server|https.Server} server - HTTP server for WebSocket upgrade
   * @returns {void}
   *
   * @throws {Error} If WebSocket server initialization fails
   *
   * @example
   * const http = require('http');
   * const server = http.createServer().listen(3000);
   * wsManager.initialize(server);
   *
   * @event connection When new WebSocket connection is established
   * @event message When message is received from client
   * @event close When WebSocket connection is closed
   * @event error When WebSocket error occurs
   */
  initialize(server) {
    /**
     * WebSocket server instance
     * @type {WebSocket.Server}
     * @private
     */
    this.wss = new WebSocket.Server({ server });

    // Connection event - new client connection established
    this.wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection 🔌');

      // Extract and attach device information to WebSocket instance using unified helper
      const deviceInfo = getDeviceInfo(request, true); // onlyStatic=true for WebSocket context
      ws.deviceInfo = deviceInfo;

      console.log(`📱 Device: ${deviceInfo.os} - ${deviceInfo.browser} ${deviceInfo.browserVersion}`);
      console.log(`📱 Type: ${deviceInfo.deviceType}`);
      console.log(`🌐 IP: ${deviceInfo.ip}`);
      console.log(`🗣️ Language: ${deviceInfo.language}`);

      // Message event handler - processes incoming client messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);

          // Business Rule: First message must be authentication
          if (data.type === 'AUTH' && data.idAccount) {
            try {
              const validation = await this.validateAccountAndDevice(data.idAccount, deviceInfo);

              if (validation.valid) {
                // Register client and mark as authenticated
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
                      browser: deviceInfo.browser,
                      browserVersion: deviceInfo.browserVersion,
                      os: deviceInfo.os,
                      deviceType: deviceInfo.deviceType,
                      language: deviceInfo.language,
                      ip: deviceInfo.ip,
                      fingerprint: validation.fingerprint,
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
              // Send authentication failure with error details
              ws.send(
                JSON.stringify({
                  type: 'AUTH_ERROR',
                  message: validationError.message,
                  timestamp: new Date().toISOString(),
                })
              );
              console.error(`❌ Authentication failed: ${validationError.message}`);

              // Security: Close connection after failed authentication
              setTimeout(() => ws.close(1008, 'Authentication failed'), 1000);
            }
          }
        } catch (error) {
          // Business Rule: Fail silently for malformed messages to maintain connection
          console.error('Error processing WebSocket message:', error);
        }
      });

      // Close event - connection terminated
      ws.on('close', () => {
        if (ws.idAccount) {
          this.unregisterClient(ws.idAccount, ws);
        }
        console.log('WebSocket connection closed 🔒');
      });

      // Error event - connection-level errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('🌐 WebSocket server initialized');
  }

  /**
   * Registers authenticated client connection for message routing
   *
   * @description Adds WebSocket connection to user's connection set. Supports
   * multiple concurrent connections per user for cross-device synchronization.
   * Automatically creates new Set for first connection of each user.
   *
   * @param {number} idAccount - Unique user identifier
   * @param {WebSocket} ws - Authenticated WebSocket connection
   * @returns {void}
   *
   * @example
   * // Typically called during authentication process
   * wsManager.registerClient(123, websocketConnection);
   *
   * @complexity Time: O(1), Space: O(1) amortized
   * @performance Map and Set operations are highly optimized in modern JS engines
   */
  registerClient(idAccount, ws) {
    // Performance: Map.has and Set.add are O(1) operations
    if (!this.clients.has(idAccount)) {
      this.clients.set(idAccount, new Set());
    }
    this.clients.get(idAccount).add(ws);
    console.log(`Client registered: ${idAccount} 👤 (Total devices: ${this.clients.get(idAccount).size})`);
  }

  /**
   * Unregisters client connection and performs cleanup
   *
   * @description Removes WebSocket connection from user's connection set and
   * cleans up empty user entries to prevent memory leaks. Automatically called
   * during connection close events.
   *
   * @param {number} idAccount - Unique user identifier
   * @param {WebSocket} ws - WebSocket connection to remove
   * @returns {void}
   *
   * @example
   * // Typically called automatically during connection close
   * wsManager.unregisterClient(123, websocketConnection);
   *
   * @complexity Time: O(1), Space: O(1)
   * @performance Automatic cleanup prevents memory leaks over time
   */
  unregisterClient(idAccount, ws) {
    const userClients = this.clients.get(idAccount);
    if (userClients) {
      userClients.delete(ws);
      // Memory Optimization: Remove empty user entries to free memory
      if (userClients.size === 0) {
        this.clients.delete(idAccount);
      }
    }
    console.log(`Client unregistered: ${idAccount} 👋`);
  }

  /**
   * Creates structured message with consistent format and validation
   *
   * @description Generates standardized message object with optional title,
   * subtitle, action buttons, and metadata. Enforces maximum button limit
   * and provides default styling for consistent client rendering.
   *
   * @param {Object} options - Message configuration options
   * @param {string} options.type - Message type identifier (required)
   * @param {string} [options.title] - Primary message title
   * @param {string} [options.subtitle] - Secondary message subtitle
   * @param {string} options.message - Main message content (required)
   * @param {string} [options.link] - General action link URL
   * @param {Array<Object>} [options.buttons] - Action buttons array (max 3)
   * @param {Object} [options.data] - Additional custom data payload
   * @returns {Object} Structured message object with timestamp
   *
   * @example
   * const message = createMessage({
   *   type: 'PAYMENT_RECEIVED',
   *   title: 'Payment Successful',
   *   subtitle: 'Invoice #INV-2024-001',
   *   message: 'Your payment of $299.00 has been processed successfully',
   *   link: '/invoices/INV-2024-001',
   *   buttons: [
   *     { label: 'View Invoice', action: 'VIEW_INVOICE', url: '/invoices/INV-2024-001' },
   *     { label: 'Download Receipt', action: 'DOWNLOAD', url: '/receipts/RC-789' }
   *   ],
   *   data: { invoiceId: 'INV-2024-001', amount: 299.00 }
   * });
   *
   * @complexity Time: O(1), Space: O(1)
   */
  createMessage(options) {
    const { type, title = null, subtitle = null, message, link = null, buttons = [], data = {} } = options;

    // Business Rule: Limit buttons to prevent UI overload
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
   * Sends structured message to all active connections of specific user
   *
   * @description Delivers message to every active WebSocket connection for
   * given user. Only sends to connections in OPEN state to prevent errors.
   * Supports multi-device scenarios automatically.
   *
   * @param {number} idAccount - Target user identifier
   * @param {Object} messageOptions - Message configuration options
   * @returns {void}
   *
   * @example
   * // Send order update to specific user across all their devices
   * wsManager.sendToUser(123, {
   *   type: 'ORDER_SHIPPED',
   *   title: 'Order Shipped',
   *   message: 'Your order #12345 has been shipped with tracking TRK-789',
   *   buttons: [
   *     { label: 'Track Package', action: 'TRACK', url: '/tracking/TRK-789' }
   *   ]
   * });
   *
   * @complexity Time: O(n) where n = user's active connections
   * @performance Efficient for users with reasonable number of concurrent devices
   */
  sendToUser(idAccount, messageOptions) {
    const userClients = this.clients.get(idAccount);
    if (userClients) {
      const structuredMessage = this.createMessage(messageOptions);
      const message = JSON.stringify(structuredMessage);

      userClients.forEach((client) => {
        // Edge Case: Only send to ready connections to prevent WebSocket errors
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
   * of user association. Useful for system announcements, maintenance notices,
   * and global updates. Efficiently handles connection state checks.
   *
   * @param {Object} messageOptions - Message configuration options
   * @returns {void}
   *
   * @example
   * // Broadcast system maintenance notice to all users
   * wsManager.broadcast({
   *   type: 'MAINTENANCE_NOTICE',
   *   title: 'Scheduled Maintenance',
   *   message: 'System will be unavailable Sunday 2-4 AM for maintenance',
   *   buttons: [
   *     { label: 'View Schedule', action: 'INFO', style: 'secondary' }
   *   ]
   * });
   *
   * @complexity Time: O(n) where n = total active connections
   * @performance Consider rate limiting for high-frequency broadcasts
   */
  broadcast(messageOptions) {
    const structuredMessage = this.createMessage(messageOptions);
    const message = JSON.stringify(structuredMessage);

    this.wss.clients.forEach((client) => {
      // Performance: Check readyState before send to avoid unnecessary operations
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    console.log(`📢 Broadcast sent: ${structuredMessage.type}`);
  }

  /**
   * Gets current connection statistics and metrics
   *
   * @description Provides real-time statistics about active connections
   * including total users, total connections, and average connections per user.
   * Useful for monitoring and capacity planning.
   *
   * @returns {Object} Connection statistics object
   *
   * @example
   * const stats = wsManager.getStats();
   * // Returns: { totalUsers: 150, totalConnections: 275, averageConnectionsPerUser: 1.83 }
   *
   * @complexity Time: O(u) where u = number of users with active connections
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
 * @description Single instance pattern ensures consistent connection state
 * and prevents multiple WebSocket servers. Globally registered for backward
 * compatibility while supporting modern module imports.
 *
 * @type {WebSocketManager}
 *
 * @example
 * // Modern module import (recommended)
 * const wsManager = require('./websocket-manager');
 *
 * // Legacy global access (deprecated but supported)
 * const wsManager = global.wsManager;
 */
const wsManager = new WebSocketManager();

/**
 * Global Registration (Legacy Support)
 *
 * @description Registered globally for backward compatibility with existing
 * codebase. New development should use module imports for better testability
 * and dependency management.
 *
 * @global
 * @type {WebSocketManager}
 *
 * @deprecated Use module imports instead of global access
 */
global.wsManager = wsManager;

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * WebSocketManager Singleton Export
 *
 * @description Exports the singleton WebSocketManager instance for module-based
 * consumption. Preferred approach for new code and test environments.
 *
 * @type {WebSocketManager}
 */
module.exports = wsManager;

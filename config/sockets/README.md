# Sockets Configuration

This directory contains the configuration for managing WebSocket connections, enabling real-time, bidirectional communication between the server and clients.

## File Structure

```
sockets/
└── webManager.js
```

---

### `webManager.js`

This file exports a singleton instance of `WebSocketManager`, a robust class designed to handle all aspects of WebSocket connections. It provides a centralized system for authentication, connection tracking, and message routing.

**Key Features:**

-   **Singleton Pattern**: Ensures that a single instance of the manager controls all WebSocket connections, providing a unified and consistent state across the application.
-   **Authentication and Security**:
    -   Integrates with the application's user accounts and sessions to validate connections.
    -   The first message from a client must be an `AUTH` message containing the user's ID.
    -   Generates a **device fingerprint** (a hash of the OS, browser, and device type) to detect potential session hijacking. While it logs mismatches, it allows connections to support legitimate device changes.
-   **Connection Management**:
    -   Maintains a registry of all connected clients, mapping user IDs to one or more WebSocket connections. This allows a single user to be connected from multiple devices simultaneously.
    -   Automatically handles client registration on successful authentication and unregistration on disconnect, preventing memory leaks.
-   **Real-time Messaging**:
    -   **Targeted Messaging**: Provides a `sendToUser(userId, message)` method to send data to all active connections for a specific user.
    -   **Broadcasting**: Includes a `broadcast(message)` method to send data to every connected client, ideal for system-wide announcements.
-   **Structured Messages**: A `createMessage` helper is used to build messages in a consistent format, with support for a title, subtitle, link, and up to three action buttons. This standardization simplifies client-side handling.
-   **Monitoring**: A `getStats()` method provides real-time statistics, including the total number of connected users and devices.

## How to Use

The `WebSocketManager` must be initialized with an HTTP or HTTPS server.

**Example Initialization:**

```javascript
const http = require('http');
const server = http.createServer(app); // 'app' is your Express app
const wsManager = require('@config/sockets/webManager.js');

// Attach the WebSocket manager to the server
wsManager.initialize(server);

server.listen(3000);
```

**Example of Sending a Notification:**

```javascript
const wsManager = require('@config/sockets/webManager.js');

// Send a notification to a specific user
wsManager.sendToUser(123, {
  type: 'NEW_MESSAGE',
  title: 'You have a new message',
  message: 'Click here to view your inbox.',
  link: '/messages',
  buttons: [
    { label: 'View Now', action: 'VIEW', url: '/messages' }
  ]
});

// Broadcast a system-wide alert
wsManager.broadcast({
  type: 'MAINTENANCE_ALERT',
  title: 'Upcoming Maintenance',
  message: 'The system will be down for scheduled maintenance in 1 hour.'
});
```

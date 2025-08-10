import express from 'express';
import { WebSocketServer } from 'ws';

// Initialize Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create WebSocket server
const wss = new WebSocketServer({ port: 9000 });

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
  
  ws.on('message', (message) => {
    console.log('Received WebSocket message:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send welcome message
  ws.send('Welcome to WebSocket server!');
});

// WebSocket server error handling
wss.on('error', (error) => {
  console.error('WebSocket Server error:', error);
});

// REST API endpoints
app.get('/', (req, res) => {
  console.log('REST Server received GET request');
  
  const message = "Broadcast to client: REST Server received GET";
  let clientCount = 0;
  
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
      clientCount++;
    }
  });
  
  console.log(`Message broadcasted to ${clientCount} WebSocket clients`);
  res.json({ 
    success: true, 
    message: 'GET request processed successfully',
    broadcastedTo: clientCount
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: wss.clients.size
  });
});

// Start HTTP server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  const { address, port } = server.address();
  console.log(`REST API server listening on http://${address}:${port}`);
  console.log(`WebSocket server listening on ws://${address}:9000`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});

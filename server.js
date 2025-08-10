import express from 'express';
import { WebSocketServer } from 'ws';

// Initialize Express app
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static('.'));

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: 9000,
  host: '127.0.0.1'  // Force IPv4
});

// Store SSE connections
const sseClients = new Set();

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

// SSE endpoint
app.get('/events', (req, res) => {
  console.log(`New SSE connection from ${req.socket.remoteAddress}`);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to the set
  sseClients.add(res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to SSE server!',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
    sseClients.delete(res);
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    sseClients.delete(res);
  });
});

// Helper function to broadcast to SSE clients
function broadcastToSSE(message, eventType = 'message') {
  let clientCount = 0;
  const data = JSON.stringify({
    type: eventType,
    message: message,
    timestamp: new Date().toISOString()
  });
  
  sseClients.forEach((client) => {
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
      clientCount++;
    } catch (error) {
      console.error('Error sending SSE message:', error);
      sseClients.delete(client);
    }
  });
  
  return clientCount;
}

// REST API endpoints
app.get('/api', (req, res) => {
  console.log('REST Server received GET request');
  
  const message = "Broadcast to client: REST Server received GET";
  let wsClientCount = 0;
  let sseClientCount = 0;
  
  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
      wsClientCount++;
    }
  });
  
  // Broadcast to all connected SSE clients
  sseClientCount = broadcastToSSE(message, 'broadcast');
  
  console.log(`Message broadcasted to ${wsClientCount} WebSocket clients and ${sseClientCount} SSE clients`);
  res.json({ 
    success: true, 
    message: 'GET request processed successfully',
    broadcastedTo: {
      websocket: wsClientCount,
      sse: sseClientCount,
      total: wsClientCount + sseClientCount
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: {
      websocket: wss.clients.size,
      sse: sseClients.size,
      total: wss.clients.size + sseClients.size
    }
  });
});

// Start HTTP server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '127.0.0.1';  // Force IPv4

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

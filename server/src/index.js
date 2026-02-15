const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const fs = require('fs');

const originalLog = console.log;
console.log = (msg, ...args) => {
    try {
        const logMsg = [msg, ...args].map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
        fs.appendFileSync('server_debug.log', logMsg + '\n');
    } catch (e) { }
    originalLog(msg, ...args);
};
const originalError = console.error;
console.error = (msg, ...args) => {
    try {
        const logMsg = [msg, ...args].map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
        fs.appendFileSync('server_debug.log', 'ERROR: ' + logMsg + '\n');
    } catch (e) { }
    originalError(msg, ...args);
};

console.log('Starting server initialization...');

process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
    process.exit(1);
});

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Database Connection
require('./config/db')();
console.log('DB setup initiated');

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});
console.log('Socket.io initialized');

// Make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_board', (boardId) => {
        socket.join(boardId);
        console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));
app.use('/api/lists', require('./routes/listRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve static files from the client/dist directory
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
    });
} else {
    // Basic Route for development
    app.get('/', (req, res) => {
        res.send('Task Collaboration Platform API is running');
    });
}

const PORT = process.env.PORT || 5000;
console.log(`Attempting to listen on port ${PORT}`);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

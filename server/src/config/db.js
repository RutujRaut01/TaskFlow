const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
    try {
        try { fs.appendFileSync('server_debug.log', 'DB: Attempting connect...\n'); } catch (e) { }
        console.log('Attempting to connect to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        try { fs.appendFileSync('server_debug.log', `DB: Connected to ${conn.connection.host}\n`); } catch (e) { }
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        try { fs.appendFileSync('server_debug.log', `DB: Error ${error.message}\n`); } catch (e) { }
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

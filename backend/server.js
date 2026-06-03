import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from './config/database.js';
import predictionRoutes from './routes/predictions.js';
import adminRoutes from './routes/admin.js';
import emailRoutes from './routes/email.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend running successfully' });
});

// Database connection test
app.get('/api/db-status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'Database connected' });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 World Cup Prediction Backend running on http://localhost:${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
    console.log(`🗄️  Database: ${process.env.DB_HOST}`);
});

export default app;

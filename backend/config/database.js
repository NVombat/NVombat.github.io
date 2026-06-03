import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'worldcup_predictions',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database and tables
export async function initializeDatabase() {
    const connection = await pool.getConnection();
    try {
        // Create database if not exists
        await connection.query(`
            CREATE DATABASE IF NOT EXISTS worldcup_predictions
        `);

        // Switch to database
        await connection.query(`USE worldcup_predictions`);

        // Create predictions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS predictions (
                id VARCHAR(36) PRIMARY KEY,
                player_name VARCHAR(255) NOT NULL,
                player_email VARCHAR(255) NOT NULL UNIQUE,
                r32_1 VARCHAR(100),
                r32_2 VARCHAR(100),
                r16_1 VARCHAR(100),
                r16_2 VARCHAR(100),
                qf VARCHAR(100),
                sf VARCHAR(100),
                final_team VARCHAR(100),
                winner VARCHAR(100),
                total_score INT DEFAULT 0,
                email_confirmed BOOLEAN DEFAULT FALSE,
                confirmation_code VARCHAR(50),
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(player_email),
                INDEX(email_confirmed)
            )
        `);

        // Create actual results table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS actual_results (
                team_name VARCHAR(100) PRIMARY KEY,
                actual_stage VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create logs table for admin actions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    } finally {
        connection.release();
    }
}

// Initialize on startup
initializeDatabase();

export default pool;

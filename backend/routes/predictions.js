import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { sendConfirmationEmail, sendAdminNotification } from '../services/emailService.js';

const router = express.Router();

// Submit prediction
router.post('/submit', async (req, res) => {
    try {
        const { playerName, playerEmail, predictions } = req.body;

        // Validate input
        if (!playerName || !playerEmail || !predictions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if email already exists
        const connection = await pool.getConnection();
        const [existingPredictions] = await connection.query(
            'SELECT id FROM predictions WHERE player_email = ?',
            [playerEmail.toLowerCase()]
        );

        if (existingPredictions.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Email already submitted predictions' });
        }

        // Generate confirmation code
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const predictionId = uuidv4();

        // Insert prediction into database
        await connection.query(
            `INSERT INTO predictions (
                id, player_name, player_email, 
                r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner,
                confirmation_code, email_confirmed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                predictionId,
                playerName,
                playerEmail.toLowerCase(),
                predictions[0]?.team || null,
                predictions[1]?.team || null,
                predictions[2]?.team || null,
                predictions[3]?.team || null,
                predictions[4]?.team || null,
                predictions[5]?.team || null,
                predictions[6]?.team || null,
                predictions[7]?.team || null,
                confirmationCode,
                true // Email confirmed upon submission (can add verification step later)
            ]
        );

        connection.release();

        // Send confirmation email
        const formattedPredictions = predictions.map((p, idx) => ({
            stage: p.predictedStage,
            team: p.team,
            points: p.pointsPossible
        }));

        await sendConfirmationEmail(playerEmail, playerName, formattedPredictions, confirmationCode);

        // Notify admin
        await sendAdminNotification(process.env.ADMIN_EMAIL, playerName, playerEmail);

        res.json({
            success: true,
            message: 'Predictions submitted successfully',
            confirmationCode,
            predictionId
        });

    } catch (error) {
        console.error('Submit prediction error:', error);
        res.status(500).json({ error: 'Failed to submit predictions' });
    }
});

// Get all predictions (with confirmation)
router.get('/all', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [predictions] = await connection.query(
            'SELECT player_name, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, total_score, submitted_at FROM predictions WHERE email_confirmed = TRUE ORDER BY total_score DESC'
        );
        connection.release();

        res.json(predictions);
    } catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [leaderboard] = await connection.query(`
            SELECT 
                player_name,
                total_score,
                submitted_at,
                ROW_NUMBER() OVER (ORDER BY total_score DESC, submitted_at ASC) as rank
            FROM predictions 
            WHERE email_confirmed = TRUE
            ORDER BY total_score DESC, submitted_at ASC
        `);
        connection.release();

        res.json(leaderboard);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;

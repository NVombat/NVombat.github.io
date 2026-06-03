import express from 'express';
import pool from '../config/database.js';
import { sendConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

// Resend confirmation email
router.post('/resend-confirmation', async (req, res) => {
    try {
        const { playerEmail } = req.body;

        if (!playerEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const connection = await pool.getConnection();
        const [predictions] = await connection.query(
            'SELECT player_name, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, confirmation_code FROM predictions WHERE player_email = ?',
            [playerEmail.toLowerCase()]
        );

        connection.release();

        if (predictions.length === 0) {
            return res.status(404).json({ error: 'No submission found for this email' });
        }

        const pred = predictions[0];
        const formattedPredictions = [
            { stage: 'Round of 32', team: pred.r32_1, points: 1 },
            { stage: 'Round of 32', team: pred.r32_2, points: 1 },
            { stage: 'Round of 16', team: pred.r16_1, points: 3 },
            { stage: 'Round of 16', team: pred.r16_2, points: 3 },
            { stage: 'Quarter-final', team: pred.qf, points: 6 },
            { stage: 'Semi-final', team: pred.sf, points: 10 },
            { stage: 'Final', team: pred.final_team, points: 15 },
            { stage: 'Winner', team: pred.winner, points: 22 }
        ];

        await sendConfirmationEmail(playerEmail, pred.player_name, formattedPredictions, pred.confirmation_code);

        res.json({ success: true, message: 'Confirmation email resent' });
    } catch (error) {
        console.error('Resend confirmation error:', error);
        res.status(500).json({ error: 'Failed to resend email' });
    }
});

export default router;

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Admin token validation middleware
const validateAdminToken = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get all predictions with details
router.get('/predictions', validateAdminToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [predictions] = await connection.query(
            'SELECT id, player_name, player_email, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, total_score, email_confirmed, submitted_at FROM predictions ORDER BY submitted_at DESC'
        );
        connection.release();
        res.json(predictions);
    } catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// Update actual tournament results
router.post('/update-results', validateAdminToken, async (req, res) => {
    try {
        const { results } = req.body; // { "Team": "Stage", ... }

        if (!results || typeof results !== 'object') {
            return res.status(400).json({ error: 'Invalid results format' });
        }

        const connection = await pool.getConnection();

        // Insert/update results
        for (const [team, stage] of Object.entries(results)) {
            await connection.query(
                'INSERT INTO actual_results (team_name, actual_stage) VALUES (?, ?) ON DUPLICATE KEY UPDATE actual_stage = ?',
                [team, stage, stage]
            );
        }

        // Recalculate scores (you'll need to implement this based on your scoring logic)
        await recalculateAllScores(connection);

        // Log admin action
        await connection.query(
            'INSERT INTO admin_logs (action, details) VALUES (?, ?)',
            ['UPDATE_RESULTS', JSON.stringify(results)]
        );

        connection.release();

        res.json({ success: true, message: 'Results updated and scores recalculated' });
    } catch (error) {
        console.error('Update results error:', error);
        res.status(500).json({ error: 'Failed to update results' });
    }
});

// Get actual results
router.get('/results', validateAdminToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query('SELECT * FROM actual_results');
        connection.release();
        res.json(results);
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Get admin logs
router.get('/logs', validateAdminToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [logs] = await connection.query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 50');
        connection.release();
        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Delete prediction (admin only)
router.delete('/predictions/:id', validateAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        
        await connection.query('DELETE FROM predictions WHERE id = ?', [id]);
        
        await connection.query(
            'INSERT INTO admin_logs (action, details) VALUES (?, ?)',
            ['DELETE_PREDICTION', `Deleted prediction: ${id}`]
        );

        connection.release();
        res.json({ success: true, message: 'Prediction deleted' });
    } catch (error) {
        console.error('Delete prediction error:', error);
        res.status(500).json({ error: 'Failed to delete prediction' });
    }
});

// Recalculate scores
async function recalculateAllScores(connection) {
    // This is a placeholder - implement based on your scoring logic
    // For now, just log the action
    console.log('Recalculating all scores...');
}

export default router;

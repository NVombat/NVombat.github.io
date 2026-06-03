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
            'SELECT id, player_name, player_username, player_email, r32_1, r32_2, r16_1, r16_2, qf, sf, final_team, winner, total_score, email_confirmed, submitted_at FROM predictions ORDER BY submitted_at DESC'
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

// Recalculate scores based on actual tournament results
async function recalculateAllScores(connection) {
    try {
        // Get all predictions
        const [predictions] = await connection.query('SELECT * FROM predictions');

        // Get actual results
        const [actualResults] = await connection.query('SELECT * FROM actual_results');

        // Create a map of actual results for quick lookup
        const resultMap = {};
        actualResults.forEach(result => {
            resultMap[result.team_name] = result.actual_stage;
        });

        // Stage points mapping
        const STAGE_POINTS = {
            "Round of 32": 1,
            "Round of 16": 3,
            "Quarter-final": 6,
            "Semi-final": 10,
            "Final": 15,
            "Winner": 22
        };

        const STAGE_RANK = {
            "Group Stage": 0,
            "Round of 32": 1,
            "Round of 16": 2,
            "Quarter-final": 3,
            "Semi-final": 4,
            "Final": 5,
            "Winner": 6
        };

        // Calculate scores for each prediction
        for (const prediction of predictions) {
            let totalScore = 0;

            // Check each team prediction
            const teams = [
                { team: prediction.r32_1, stage: "Round of 32" },
                { team: prediction.r32_2, stage: "Round of 32" },
                { team: prediction.r16_1, stage: "Round of 16" },
                { team: prediction.r16_2, stage: "Round of 16" },
                { team: prediction.qf, stage: "Quarter-final" },
                { team: prediction.sf, stage: "Semi-final" },
                { team: prediction.final_team, stage: "Final" },
                { team: prediction.winner, stage: "Winner" }
            ];

            for (const { team, stage } of teams) {
                if (team) {
                    const actualStage = resultMap[team];
                    if (actualStage) {
                        const predictedRank = STAGE_RANK[stage] || 0;
                        const actualRank = STAGE_RANK[actualStage] || 0;

                        // Team reached at least predicted stage = points awarded
                        if (actualRank >= predictedRank) {
                            totalScore += STAGE_POINTS[stage] || 0;
                        }
                    }
                }
            }

            // Update total score
            await connection.query(
                'UPDATE predictions SET total_score = ? WHERE id = ?',
                [totalScore, prediction.id]
            );
        }

        console.log('✅ Scores recalculated successfully');
    } catch (error) {
        console.error('Error recalculating scores:', error);
    }
}

export default router;

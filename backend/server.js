const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { translate } = require('./local-ai-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('✓ Connected to SQLite database');
    }
});

// Initialize tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        isVerified INTEGER DEFAULT 0,
        verificationToken TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        original TEXT,
        translation TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);
    console.log('✓ Database tables initialized');
});

// Routes
// Translate Endpoint
app.post('/api/translate', async (req, res) => {
    console.log('• POST /api/translate');
    const { text, userId } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const translation = await translate(text);

        if (userId) {
            db.run(
                'INSERT INTO history (userId, original, translation) VALUES (?, ?, ?)',
                [userId, text, translation],
                (err) => {
                    if (err) console.error('Error saving history:', err);
                }
            );
        }

        res.json({ translation });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// History Endpoint
app.get('/api/history/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(
        'SELECT * FROM history WHERE userId = ? ORDER BY timestamp DESC LIMIT 50',
        [userId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Database error' });
            } else {
                res.json(rows);
            }
        }
    );
});

// Auth Routes (Simplified for restoration)
const authRoutes = require('./auth-routes');
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════╗
║   Darija Translator Backend      ║
║   PORT: ${PORT}                     ║
╚══════════════════════════════════╝
    `);
});

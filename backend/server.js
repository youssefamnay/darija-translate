const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const fs = require('fs');
const { router: authRouter, authenticateToken } = require('./auth-routes');
const db = require('./database');
const { translateText } = require('./local-ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or file://)
        if (!origin) return callback(null, true);

        // Allow all origins in development
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRouter);

// Translation endpoint (existing functionality, now with optional auth)
app.post('/api/translate', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Texte manquant' });
    }

    try {
        // Call Gemini Service
        const translation = await translateText(text);

        // If user is authenticated, save translation
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Save translation to database
                db.saveTranslation(decoded.userId, text, translation, (err) => {
                    if (err) console.error('Error saving translation:', err);
                });
            } catch (err) {
                // Token invalid, just continue without saving
                console.log('Translation without auth');
            }
        }

        res.json({ translation });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Erreur de traduction' });
    }
});

// Serve verification page
app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    const templatesDir = path.join(__dirname, 'templates');

    if (!token) {
        return res.sendFile(path.join(templatesDir, 'verify_missing.html'));
    }

    // Verify the token
    db.getVerificationToken(token, (err, tokenData) => {
        if (err || !tokenData) {
            return res.sendFile(path.join(templatesDir, 'verify_invalid.html'));
        }

        // Verify user
        db.verifyUser(tokenData.user_id, (err) => {
            if (err) {
                return res.sendFile(path.join(templatesDir, 'verify_error.html'));
            }

            // Delete used token
            db.deleteVerificationToken(token, () => { });

            // Read success template and replace placeholder
            fs.readFile(path.join(templatesDir, 'verify_success.html'), 'utf8', (err, html) => {
                if (err) {
                    console.error('Error reading template:', err);
                    return res.status(500).send('Erreur interne');
                }
                const finalHtml = html.replace('{{email}}', tokenData.email);
                res.send(finalHtml);
            });
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🇲🇦  Darija Translator Backend Server  🇲🇦          ║
║                                                       ║
║   Server running on: http://localhost:${PORT}       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                       ║
║   Endpoints:                                          ║
║   • POST /api/auth/register                          ║
║   • POST /api/auth/login                             ║
║   • GET  /api/auth/verify-email/:token               ║
║   • POST /api/auth/forgot-password                   ║
║   • POST /api/auth/reset-password                    ║
║   • GET  /api/auth/user (protected)                  ║
║   • POST /api/translate                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down gracefully...');
    db.close();
    process.exit(0);
});

module.exports = app;

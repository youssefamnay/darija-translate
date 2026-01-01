const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const emailService = require('./email-service');
require('dotenv').config();

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

// Register endpoint
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if user already exists
        db.getUserByEmail(email, async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user (verified by default)
            db.createUser(email, passwordHash, async (err, userId) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                }

                // Auto-verify the user immediately
                db.verifyUser(userId, (err) => {
                    if (err) console.error("Error auto-verifying user:", err);
                });

                res.status(201).json({
                    message: 'Compte créé avec succès ! Vous pouvez vous connecter.',
                    userId,
                    email
                });
            });
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        db.getUserByEmail(email, async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Check if email is verified (Skipped for simple auth)
            /*
            if (!user.verified) {
                return res.status(403).json({
                    error: 'Email non vérifié',
                    needsVerification: true
                });
            }
            */

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    verified: user.verified
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Verify email endpoint
router.get('/verify-email/:token', (req, res) => {
    const { token } = req.params;

    db.getVerificationToken(token, (err, tokenData) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (!tokenData) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        // Verify user
        db.verifyUser(tokenData.user_id, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la vérification' });
            }

            // Delete used token
            db.deleteVerificationToken(token, () => { });

            res.json({
                message: 'Email vérifié avec succès !',
                email: tokenData.email
            });
        });
    });
});

// Resend verification email
router.post('/resend-verification', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const { email } = req.body;

    db.getUserByEmail(email, async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        if (user.verified) {
            return res.status(400).json({ error: 'Email déjà vérifié' });
        }

        // Generate new verification token
        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        db.createVerificationToken(verificationToken, user.id, expiresAt, async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            await emailService.sendVerificationEmail(email, verificationToken);
            res.json({ message: 'Email de vérification renvoyé' });
        });
    });
});

// Forgot password endpoint
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const { email } = req.body;

    db.getUserByEmail(email, async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        // Don't reveal if user exists or not for security
        if (!user) {
            return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
        }

        // Generate reset token
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        db.createPasswordResetToken(resetToken, user.id, expiresAt, async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            await emailService.sendPasswordResetEmail(email, resetToken);
            res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
        });
    });
});

// Reset password endpoint
router.post('/reset-password', [
    body('token').exists(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    const { token, newPassword } = req.body;

    db.getPasswordResetToken(token, async (err, tokenData) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (!tokenData) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        db.updatePassword(tokenData.user_id, passwordHash, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
            }

            // Delete used token
            db.deletePasswordResetToken(token, () => { });

            res.json({ message: 'Mot de passe réinitialisé avec succès' });
        });
    });
});

// Get current user (protected route)
router.get('/user', authenticateToken, (req, res) => {
    db.getUserById(req.user.userId, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json({
            id: user.id,
            email: user.email,
            verified: user.verified,
            createdAt: user.created_at
        });
    });
});

// Save translation (protected route)
router.post('/save-translation', authenticateToken, [
    body('sourceText').exists(),
    body('translatedText').exists()
], (req, res) => {
    const { sourceText, translatedText } = req.body;

    db.saveTranslation(req.user.userId, sourceText, translatedText, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }

        res.json({ message: 'Traduction sauvegardée' });
    });
});

// Get user translations (protected route)
router.get('/translations', authenticateToken, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;

    db.getUserTranslations(req.user.userId, limit, (err, translations) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        res.json({ translations });
    });
});

module.exports = { router, authenticateToken };

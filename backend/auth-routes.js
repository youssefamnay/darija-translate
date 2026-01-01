const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('./email-service');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const verificationToken = uuidv4();

    db.run(
        'INSERT INTO users (id, email, password, verificationToken) VALUES (?, ?, ?, ?)',
        [userId, email, hashedPassword, verificationToken],
        (err) => {
            if (err) return res.status(400).json({ error: 'Email already exists' });

            // Send email (mocked for now if email service fails)
            try {
                sendVerificationEmail(email, verificationToken);
            } catch (e) {
                console.error('Email error', e);
            }
            res.json({ message: 'Registration successful. Check your email.' });
        }
    );
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email } });
    });
});

module.exports = router;

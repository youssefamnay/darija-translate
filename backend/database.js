const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('✓ Connected to SQLite database');
                this.initTables();
            }
        });
    }

    initTables() {
        this.db.serialize(() => {
            // Users table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    verified INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Verification tokens table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS verification_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token TEXT UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            // Password reset tokens table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token TEXT UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            // Translation history table (optional - for storing user translations)
            this.db.run(`
                CREATE TABLE IF NOT EXISTS translations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    source_text TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            console.log('✓ Database tables initialized');
        });
    }

    // User operations
    createUser(email, passwordHash, callback) {
        const sql = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
        this.db.run(sql, [email, passwordHash], function (err) {
            callback(err, this ? this.lastID : null);
        });
    }

    getUserByEmail(email, callback) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        this.db.get(sql, [email], callback);
    }

    getUserById(id, callback) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        this.db.get(sql, [id], callback);
    }

    verifyUser(userId, callback) {
        const sql = 'UPDATE users SET verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        this.db.run(sql, [userId], callback);
    }

    updatePassword(userId, passwordHash, callback) {
        const sql = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        this.db.run(sql, [passwordHash, userId], callback);
    }

    // Verification token operations
    createVerificationToken(token, userId, expiresAt, callback) {
        const sql = 'INSERT INTO verification_tokens (token, user_id, expires_at) VALUES (?, ?, ?)';
        this.db.run(sql, [token, userId, expiresAt], callback);
    }

    getVerificationToken(token, callback) {
        const sql = `
            SELECT vt.*, u.email 
            FROM verification_tokens vt 
            JOIN users u ON vt.user_id = u.id 
            WHERE vt.token = ? AND vt.expires_at > datetime('now')
        `;
        this.db.get(sql, [token], callback);
    }

    deleteVerificationToken(token, callback) {
        const sql = 'DELETE FROM verification_tokens WHERE token = ?';
        this.db.run(sql, [token], callback);
    }

    // Password reset token operations
    createPasswordResetToken(token, userId, expiresAt, callback) {
        const sql = 'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)';
        this.db.run(sql, [token, userId, expiresAt], callback);
    }

    getPasswordResetToken(token, callback) {
        const sql = `
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt 
            JOIN users u ON prt.user_id = u.id 
            WHERE prt.token = ? AND prt.expires_at > datetime('now')
        `;
        this.db.get(sql, [token], callback);
    }

    deletePasswordResetToken(token, callback) {
        const sql = 'DELETE FROM password_reset_tokens WHERE token = ?';
        this.db.run(sql, [token], callback);
    }

    // Translation history operations
    saveTranslation(userId, sourceText, translatedText, callback) {
        const sql = 'INSERT INTO translations (user_id, source_text, translated_text) VALUES (?, ?, ?)';
        this.db.run(sql, [userId, sourceText, translatedText], callback);
    }

    getUserTranslations(userId, limit = 50, callback) {
        const sql = 'SELECT * FROM translations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?';
        this.db.all(sql, [userId, limit], callback);
    }

    close() {
        this.db.close();
    }
}

module.exports = new Database();

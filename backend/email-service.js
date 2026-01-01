const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = (email, token) => {
    console.log(`[Email Service] Sending verification email to ${email} with token ${token}`);
};

const sendWelcomeEmail = (email) => {
    console.log(`[Email Service] Sending welcome email to ${email}`);
};

const sendPasswordResetEmail = (email, token) => {
    console.log(`[Email Service] Sending reset email to ${email} with token ${token}`);
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail };

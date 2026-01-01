const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
        this.fromName = process.env.FROM_NAME || 'Darija Translator';
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to,
                subject,
                html
            });
            console.log('✓ Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('✗ Email error:', error);
            return { success: false, error: error.message };
        }
    }

    getTemplate(templateName) {
        const templatePath = path.join(__dirname, 'email-templates', `${templateName}.html`);
        return fs.readFileSync(templatePath, 'utf8');
    }

    async sendWelcomeEmail(email, verificationToken) {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

        console.log('---------------------------------------------------');
        console.log('📧 EMAIL SIMULATION (Welcome & Verify)');
        console.log(`To: ${email}`);
        console.log(`Link: ${verificationUrl}`);
        console.log('---------------------------------------------------');

        let template = this.getTemplate('welcome');
        template = template.replace('{{EMAIL}}', email);
        template = template.replace('{{VERIFICATION_URL}}', verificationUrl);
        template = template.replace('{{APP_NAME}}', process.env.APP_NAME);

        return await this.sendEmail(
            email,
            `Bienvenue sur ${process.env.APP_NAME} ! 🇲🇦`,
            template
        );
    }

    async sendVerificationEmail(email, verificationToken) {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

        console.log('---------------------------------------------------');
        console.log('📧 EMAIL SIMULATION (Verify)');
        console.log(`To: ${email}`);
        console.log(`Link: ${verificationUrl}`);
        console.log('---------------------------------------------------');

        let template = this.getTemplate('verification');
        template = template.replace('{{EMAIL}}', email);
        template = template.replace('{{VERIFICATION_URL}}', verificationUrl);
        template = template.replace('{{APP_NAME}}', process.env.APP_NAME);

        return await this.sendEmail(
            email,
            'Vérifiez votre adresse email',
            template
        );
    }

    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

        console.log('---------------------------------------------------');
        console.log('📧 EMAIL SIMULATION (Password Reset)');
        console.log(`To: ${email}`);
        console.log(`Link: ${resetUrl}`);
        console.log('---------------------------------------------------');

        let template = this.getTemplate('reset-password');
        template = template.replace('{{EMAIL}}', email);
        template = template.replace('{{RESET_URL}}', resetUrl);
        template = template.replace('{{APP_NAME}}', process.env.APP_NAME);

        return await this.sendEmail(
            email,
            'Réinitialisation de votre mot de passe',
            template
        );
    }

    async sendTranslationNotification(email, translations) {
        // Optional: Send daily/weekly translation summary
        const translationList = translations.map(t =>
            `<li><strong>${t.source_text}</strong> → ${t.translated_text}</li>`
        ).join('');

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #c1272d;">Vos traductions récentes</h2>
                <ul>${translationList}</ul>
                <p>Merci d'utiliser Darija Translator !</p>
            </div>
        `;

        return await this.sendEmail(
            email,
            'Résumé de vos traductions',
            html
        );
    }
}

module.exports = new EmailService();

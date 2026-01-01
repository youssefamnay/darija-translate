# 🇲🇦 Darija Translate

> A modern browser extension for translating English to Moroccan Darija (Moroccan Arabic Dialect) with AI-powered translation and user authentication.

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## ✨ Features

- 🌍 **Instant Translation** - Translate selected text from English to Moroccan Darija
- 🎯 **Context Menu Integration** - Right-click to translate any selected text
- 🔐 **User Authentication** - Secure email-based registration and login
- 📧 **Email Notifications** - Welcome emails, verification, and password reset
- 📝 **Translation History** - Keep track of your previous translations
- 🎨 **Modern UI** - Beautiful interface with Moroccan-inspired design (Red/Green theme)
- 💾 **Offline Storage** - SQLite database for user data and history
- 🚀 **Fast & Lightweight** - Optimized performance with minimal resource usage

## 🛠️ Tech Stack

### Frontend (Extension)
- **Manifest V3** - Latest Chrome Extension API
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** - Glassmorphism effects and smooth animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Chrome, Edge, or any Chromium-based browser
- SMTP email account (for email notifications)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/darija-translate.git
cd darija-translate
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Darija Translator <your_email@gmail.com>
```

> **Note:** For Gmail, you need to use an [App Password](https://support.google.com/accounts/answer/185833)

### 4. Start the Backend Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Load the Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the project root directory (`darija-translate`)
5. The extension icon will appear in your browser toolbar! 🎉

## 📖 Usage

### First Time Setup

1. Click the extension icon in your browser toolbar
2. Click **Register** to create a new account
3. Enter your email and password
4. Check your email for verification link
5. Click the verification link to activate your account
6. Log in with your credentials

### Translating Text

**Method 1: Context Menu**
1. Select any English text on a webpage
2. Right-click and choose **"Translate to Darija"**
3. View the translation in a popup

**Method 2: Extension Popup**
1. Click the extension icon
2. Type or paste English text
3. Click **Translate**
4. Copy the Darija translation

### View Translation History

1. Click the extension icon
2. Navigate to the **History** tab
3. Browse your previous translations

## 🏗️ Project Structure

```
darija-translate/
├── backend/
│   ├── server.js                 # Main server file
│   ├── auth-routes.js            # Authentication endpoints
│   ├── local-ai-service.js       # Translation service
│   ├── email-service.js          # Email functionality
│   ├── email-templates/          # HTML email templates
│   │   ├── verification.html
│   │   ├── welcome.html
│   │   └── reset-password.html
│   ├── templates/                # Success page templates
│   └── package.json
├── website/                      # Standalone web version
│   ├── index.html
│   ├── styles.css
│   └── server.js
├── manifest.json                 # Extension configuration
├── popup.html                    # Extension popup UI
├── popup.js                      # Popup logic
├── auth.html                     # Authentication page
├── auth.js                       # Auth logic
├── background.js                 # Service worker
├── content.js                    # Content script
├── options.html                  # Settings page
├── options.js                    # Settings logic
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify/:token` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Translation

- `POST /api/translate` - Translate text
  ```json
  {
    "text": "Hello, how are you?",
    "userId": "user_id_here"
  }
  ```

### History

- `GET /api/history/:userId` - Get user's translation history

## 🎨 Customization

### Changing the Theme

Edit the CSS variables in `popup.html`:

```css
:root {
    --primary-red: #C1272D;
    --primary-green: #006233;
    --gold: #FFD700;
    /* Add your custom colors */
}
```

### Modifying Translation Service

The translation logic is in `backend/local-ai-service.js`. You can integrate with external APIs like:
- Google Translate API
- OpenAI GPT
- Custom ML models

## 🧪 Development

### Running in Development Mode

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Testing the Extension

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the new functionality

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify `.env` file exists with correct values
- Run `npm install` to ensure dependencies are installed

### Extension not loading
- Ensure manifest.json is valid
- Check browser console for errors
- Verify all file paths are correct

### Email not sending
- Verify SMTP credentials in `.env`
- For Gmail, use App Password instead of regular password
- Check spam folder

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Moroccan Darija language community
- Open source contributors
- Chrome Extension documentation

## 📞 Support

If you have any questions or issues, please:
- Open an issue on GitHub
- Contact: your.email@example.com

---

**Made with ❤️ for the Moroccan community** 🇲🇦

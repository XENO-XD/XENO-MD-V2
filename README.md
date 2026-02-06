# ✧ XENO-MD-V2 ✧

<div align="center">
  <img src="https://files.catbox.moe/jhdz71.jpeg" alt="XENO MD V2" width="300" height="300" style="border-radius: 15px; box-shadow: 0px 0px 20px 5px rgba(0, 255, 136, 0.4);">
  
  <br>
  <br>

  [![Deployment](https://img.shields.io/badge/Deploy-Render-green?style=for-the-badge&logo=render)](https://render.com)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-succes?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)

  <p align="center">
    <strong>Simple | Fast | Secure | Multi-Device WhatsApp Bot</strong>
  </p>
</div>

<hr>

## 📜 Description
XENO MD V2 is a lightweight, efficient, and user-friendly WhatsApp bot built with the Baileys library. It features automatic pairing via console log or web interface and secure session management.

## ✨ Features
- **Automatic Pairing**: Generates pairing code automatically in the console or via web.
- **Secure Session**: Sessions are saved locally or uploaded to Mega.nz for persistence.
- **Fast & Lightweight**: running on `@whiskeysockets/baileys`.
- **Plug-and-Play**: Easy to deploy on Render, Koyeb, or VPS.

## 🚀 Deployment

### Method 1: Deploy on Cloud (Render / Katabump / Koyeb)

#### ⚡ Quick Deploy

[![Deploy to Katabump](https://img.shields.io/badge/Deploy%20on-Katabump-blue?style=for-the-badge&logo=serverless)](https://katabump.com)
[![Deploy to Render](https://img.shields.io/badge/Deploy%20on-Render-green?style=for-the-badge&logo=render)](https://render.com/deploy?repo=https://github.com/XENO-XD/XENO-MD-V2)

**Steps:**
1. Fork this repository.
2. Click one of the buttons above (or manually deploy on your platform).
3. Check the **Console Logs** securely during the first startup.
4. The bot will display a **Pairing Code** (e.g., `1234-5678`).
5. Open WhatsApp > Linked Devices > Link a Device > Link with phone number.
6. Enter the code. The bot will connect and start working.

### Method 2: Local (Windows/Linux)
1. Install [Node.js](https://nodejs.org/) (v18 or higher).
2. Clone the repository:
   ```bash
   git clone https://github.com/XENO-XD/XENO-MD-V2.git
   cd XENO-MD-V2
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the bot:
   ```bash
   npm start
   ```
5. Follow the console instructions to pair.

## ⚙️ Configuration
You can configure the bot by setting Environment Variables or modifying `config.js`.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SESSION_ID` | Your session ID (optional if running locally/persistent). | `null` |
| `BOT_NUMBER` | Number to pair with (console pairing). | `919645991937` |
| `OWNER_NUMBER` | The owner's WhatsApp number. | `919645991937` |
| `PREFIX` | Command prefix. | `.` |

## 🤝 Credits
- **XENO-XD**: Project Owner & Developer.
- **Biased Goat**: For the base logic.

<div align="center">
  <p>Made with ❤️ by XENO</p>
</div>

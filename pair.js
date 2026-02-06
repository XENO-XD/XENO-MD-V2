const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const { File } = require('megajs');

function pairingRouter(connectToWA) {
    router.get("/", (req, res) => {
        res.sendFile(__dirname + "/pair.html");
    });

    router.get("/code", async (req, res) => {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
        try {
            let phoneNumber = req.query.number;
            if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });
            phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

            // Minimal validation: must be at least 10 digits
            if (phoneNumber.length < 10) return res.status(400).json({ error: "Invalid phone number length" });

            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!sock.authState.creds.registered) {
                await new Promise(r => setTimeout(r, 2000));
                const code = await sock.requestPairingCode(phoneNumber);
                res.json({ code: code });
            } else {
                res.json({ error: "Session already exists" });
            }

            sock.ev.on("creds.update", saveCreds);
            sock.ev.on("connection.update", async (update) => {
                const { connection } = update;
                if (connection === "open") {
                    console.log("Pairing Successful! Connected.");
                    await new Promise(r => setTimeout(r, 1000));

                    // Upload to Mega
                    const { Storage } = require('megajs');
                    const email = 'xenopc43@gmail.com';
                    const password = 'xenosir@###123';

                    try {
                        const storage = new Storage({ email, password });

                        storage.on('ready', async () => {
                            console.log('Mega Connected');
                            const creds = fs.readFileSync("./auth_info_baileys/creds.json");

                            storage.upload('session.json', creds, (err, file) => {
                                if (err) {
                                    console.error('Mega Upload Error:', err);
                                    // Even if upload fails, we are connected locally, so proceed.
                                } else {
                                    file.link(async (err, link) => {
                                        if (!err) {
                                            const sessionID = link.replace('https://mega.nz/file/', '');
                                            const msg = `*XENO-MD SESSION ID*\n\n${sessionID}\n\n*⚠️ IMPORTANT:*\n1. Copy this Session ID.\n2. Go to Render Dashboard > Environment.\n3. Add 'SESSION_ID' with this value.\n4. This ensures your bot stays connected after restarts.`;
                                            await sock.sendMessage(sock.user.id, { text: msg });
                                        }
                                    });
                                }
                            });
                        });
                    } catch (megaIsues) {
                        console.error(megaIsues);
                    }

                    // Start the main bot logic
                    await new Promise(r => setTimeout(r, 3000));
                    await sock.end(); // Close pairing socket
                    console.log("Starting Main Bot...");
                    connectToWA(); // Start main function with the new creds
                }
            });

        } catch (err) {
            console.error(err);
            if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
        }
    });

    return router;
}

module.exports = pairingRouter;

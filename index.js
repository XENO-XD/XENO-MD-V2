const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const fs = require('fs')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms, downloadMediaMessage } = require('./lib/msg')
const axios = require('axios')
const { File } = require('megajs')
const prefix = '.'

const ownerNumber = ['919645991937']

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
  // Create auth directory if it doesn't exist
  if (!fs.existsSync(__dirname + '/auth_info_baileys')) {
    fs.mkdirSync(__dirname + '/auth_info_baileys')
  }

  // If SESSION_ID is provided, try to download/use it. 
  // Otherwise, wait for pairing.
  if (config.SESSION_ID) {
    const sessdata = config.SESSION_ID.trim()

    // Check if it's a Mega URL or ID
    const isMegaURL = sessdata.includes("mega.nz") || sessdata.includes("mega.co.nz");
    const isMegaID = sessdata.includes("#");

    if (isMegaURL || isMegaID) {
      let url = sessdata;
      if (isMegaID && !isMegaURL) {
        url = `https://mega.nz/file/${sessdata}`;
      }

      try {
        const filer = File.fromURL(url);
        filer.download((err, data) => {
          if (err) {
            console.error("Mega Session Download Error:", err);
            return;
          }
          fs.writeFile(__dirname + '/auth_info_baileys/creds.json', data, () => {
            console.log("Session downloaded from Mega ✅")
          })
        })
      } catch (err) {
        console.error("Mega Session Error:", err.message);
      }
    } else if (sessdata.length > 20) {
      // Base64
      try {
        const buff = Buffer.from(sessdata, 'base64')
        fs.writeFile(__dirname + '/auth_info_baileys/creds.json', buff, () => {
          console.log("Session loaded from Base64 ✅")
        })
      } catch (err) { }
    }
  } else {
    console.log("No SESSION_ID found. Connect using the /pair endpoint.");
  }
}


const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

//=============================================

async function connectToWA() {
  console.log("Connecting wa bot 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/')
  var { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  })

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        connectToWA()
      }
    } else if (connection === 'open') {
      console.log('😼 Installing... ')
      const path = require('path');
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          require("./plugins/" + plugin);
        }
      });
      console.log('Plugins installed successful ✅')
      console.log('Bot connected to whatsapp ✅')

      let up = `Bot Name connected successful ✅\n\nPREFIX: ${prefix}`;

      conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { image: { url: `https://files.catbox.moe/jhdz71.jpeg` }, caption: up })

    }
  })
  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === "true") {
      await conn.readMessages([mek.key])
    }
    const m = sms(conn, mek)
    const type = getContentType(mek.message)
    const content = JSON.stringify(mek.message)
    const from = mek.key.remoteJid
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = conn.user.id.split(':')[0]
    const pushname = mek.pushName || 'Sin Nombre'
    const isMe = botNumber.includes(senderNumber)
    const isOwner = ownerNumber.includes(senderNumber) || isMe
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => { }) : ''
    const groupName = isGroup ? groupMetadata?.subject : ''
    const participants = isGroup ? groupMetadata?.participants : ''
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false
    const isReact = m.message.reactionMessage ? true : false
    const reply = (teks) => {
      conn.sendMessage(from, { text: teks }, { quoted: mek })
    }

    conn.edit = async (mek, newmg) => {
      await conn.relayMessage(from, {
        protocolMessage: {
          key: mek.key,
          type: 14,
          editedMessage: {
            conversation: newmg
          }
        }
      }, {})
    }
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
      }
      let type = mime.split("/")[0] + "Message"
      if (mime === "application/pdf") {
        return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
      }
    }

    //========OwnerReact========            

    if (senderNumber.includes("919645991937")) {
      if (isReact) return
      m.react("💗")
    }


    const events = require('./command')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })

        try {
          cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (q && command.on === "text") {
        command.function(conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (
        (command.on === "image" || command.on === "photo") &&
        mek.type === "imageMessage"
      ) {
        command.function(conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      } else if (
        command.on === "sticker" &&
        mek.type === "stickerMessage"
      ) {
        command.function(conn, mek, m, { from, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
      }
    });

  })
}
app.get("/", (req, res) => {
  res.send("hey, bot started✅");
});

app.get("/pair", (req, res) => {
  res.sendFile(__dirname + "/pair.html");
});

app.get("/code", async (req, res) => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  try {
    let phoneNumber = req.query.number;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
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
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
setTimeout(() => {
  connectToWA()
}, 4000);  

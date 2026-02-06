const { cmd, commands } = require('../command')
const { sleep } = require('../lib/functions')
const { downloadMediaMessage } = require('../lib/msg')
const fs = require('fs')
const { exec } = require('child_process')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path

cmd({
    pattern: "mp3",
    desc: "Convert video to mp3 (reply to video)",
    category: "convert",
    react: "🎶",
    filename: __filename
},
    async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
        try {
            if (!quoted) return reply("❌ Please reply to a video message!")

            // In some cases quoted.message is nested, index.js handles some of it
            // but let's be safe and check where the videoMessage is
            const isVideo = quoted.message?.videoMessage || quoted.videoMessage
            if (!isVideo) return reply("❌ This is not a video! Please reply to a video.")

            const loading = await conn.sendMessage(from, { text: " [░░░░░░░░░░░░░░░░] 📥 CONVERTING..." }, { quoted: mek });
            await sleep(500);
            await conn.edit(loading, " [████░░░░░░░░░░░░] 📥 CONVERTING...");
            await sleep(500);
            await conn.edit(loading, " [████████░░░░░░░░] 📥 CONVERTING...");
            await sleep(500);
            await conn.edit(loading, " [████████████░░░░] 📥 CONVERTING...");
            await sleep(500);
            await conn.edit(loading, " [████████████████] 📥 CONVERTING...");
            await sleep(500);
            await conn.edit(loading, "✅ CONVERTED");

            const media = await downloadMediaMessage(quoted);
            const inputPath = `./${Date.now()}_video.mp4`;
            const outputPath = `./${Date.now()}_audio.mp3`;

            fs.writeFileSync(inputPath, media);

            exec(`"${ffmpegPath}" -i ${inputPath} -vn -ar 44100 -ac 2 -b:a 192k ${outputPath}`, async (err) => {
                if (err) {
                    console.error(err);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    return reply("❌ Error during conversion!");
                }

                await conn.sendMessage(from, { audio: fs.readFileSync(outputPath), mimetype: 'audio/mpeg', fileName: `converted.mp3` }, { quoted: mek });

                // Cleanup
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });

        } catch (e) {
            console.log(e)
            reply(`❌ Error: ${e.message}`)
        }
    })

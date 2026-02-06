const { fetchJson, sleep } = require('../lib/functions')
const config = require('../config')
const { cmd, commands } = require('../command')

// FETCH API URL
let baseUrl;
(async () => {
    let baseUrlGet = await fetchJson(`https://raw.githubusercontent.com/prabathLK/PUBLIC-URL-HOST-DB/main/public/url.json`)
    baseUrl = baseUrlGet.api
})();


cmd({
    pattern: "insta",
    alias: ["ig", "igdl"],
    desc: "download instagram videos/photos",
    category: "download",
    react: "🔎",
    filename: __filename
},
    async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
        try {
            if (!q || !q.startsWith("https://")) return reply("Please provide a valid Instagram URL!")

            const loading = await conn.sendMessage(from, { text: " [░░░░░░░░░░░░░░░░] 📥 DOWNLOADING..." }, { quoted: mek });
            await sleep(500);
            await conn.edit(loading, " [████░░░░░░░░░░░░] 📥 DOWNLOADING...");
            await sleep(500);
            await conn.edit(loading, " [████████░░░░░░░░] 📥 DOWNLOADING...");
            await sleep(500);
            await conn.edit(loading, " [████████████░░░░] 📥 DOWNLOADING...");
            await sleep(500);
            await conn.edit(loading, " [████████████████] 📥 DOWNLOADING...");
            await sleep(500);
            await conn.edit(loading, "✅ DOWNLOADED");

            // fetch data from api  
            let data = await fetchJson(`${baseUrl}/api/igdl?url=${q}`)

            if (!data || !data.data) {
                return reply("No media found or API is down. ❌")
            }

            const mediaList = Array.isArray(data.data) ? data.data : [data.data];

            for (let media of mediaList) {
                let url = media.url || media.dl_url || media.link;
                if (!url) continue;

                if (media.type === "video" || url.includes(".mp4")) {
                    await conn.sendMessage(from, { video: { url: url }, mimetype: "video/mp4", caption: "> ᴘᴀᴡᴇʀᴇᴅ ʙʏ xᴇɴᴏ sɪʀ" }, { quoted: mek })
                } else {
                    await conn.sendMessage(from, { image: { url: url }, caption: "> ᴘᴀᴡᴇʀᴇᴅ ʙʏ xᴇɴᴏ sɪʀ" }, { quoted: mek })
                }
            }

        } catch (e) {
            console.log(e)
            reply('An error occurred while processing your request. maybe api is down ❌')
        }
    })

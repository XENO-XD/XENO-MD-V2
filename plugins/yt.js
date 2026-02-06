const { cmd, commands } = require('../command')
const axios = require('axios');
const yts = require('yt-search');
const config = require('../config');

cmd({
    pattern: "youtube",
    alias: ["ytdl", "video", "yt", "mp4"],
    desc: "Download YouTube videos with quality selection",
    category: "downloader",
    filename: __filename
},
    async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
        try {
            const botName = 'xᴇɴᴏ ᴍᴅ';

            if (!q) {
                return await conn.sendMessage(from, {
                    text: "❌ *Please provide a YouTube Name or URL!*"
                }, { quoted: mek });
            }

            await conn.sendMessage(from, { react: { text: '🔎', key: mek.key } });

            let videoInfo;
            try {
                const searchRes = await yts(q);
                videoInfo = searchRes.videos[0];
            } catch (e) {
                return await conn.sendMessage(from, { text: "❌ *Video Not Found!*" }, { quoted: mek });
            }

            if (!videoInfo) {
                return await conn.sendMessage(from, { text: "❌ *Video Not Found!*" }, { quoted: mek });
            }

            const captionMessage = `
╭───「 👸 *${botName}* 」───◆
│
│ 🎬 *Title:* ${videoInfo.title}
│ 👤 *Author:* ${videoInfo.author.name}
│ ⏱️ *Duration:* ${videoInfo.timestamp}
│ 👁️ *Views:* ${videoInfo.views}
│ 📅 *Ago:* ${videoInfo.ago}
│
╰───────────────────────◆

👇 *ꜱᴇʟᴇᴄᴛ ʏᴏᴜʀ ᴅᴏᴡɴʟᴏᴀᴅ ᴛʏᴘᴇ* 👇
1️⃣. 🎬 360P QUALITY
2️⃣. 📹 480P QUALITY
3️⃣. 🎥 720P QUALITY
4️⃣. 🎵 AUDIO FILE

*Reply with the number (e.g., 1) or type 'yt_360' to download.*`;

            const sentMessage = await conn.sendMessage(from, {
                image: { url: videoInfo.thumbnail || config.ALIVE_IMG },
                caption: captionMessage,
                contextInfo: {
                    externalAdReply: {
                        title: "🎥 ＹＯＵＴＵＢＥ  ＤＯＷＮＬＯＡＤＥＲ",
                        body: videoInfo.title,
                        thumbnailUrl: videoInfo.thumbnail,
                        sourceUrl: videoInfo.url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: mek });

            const messageID = sentMessage.key.id;

            // Listener for reply
            const handleYouTubeSelection = async (update) => {
                const replyMek = update.messages[0];
                if (!replyMek?.message) return;

                const isReplyToSentMsg = replyMek.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (isReplyToSentMsg && replyMek.key.remoteJid === from && replyMek.key.participant === sender || (from.endsWith("@s.whatsapp.net") && replyMek.key.remoteJid === from)) {

                    const selectedText = replyMek.message.conversation || replyMek.message.extendedTextMessage?.text;

                    await conn.sendMessage(from, { react: { text: '⬇️', key: replyMek.key } });

                    let selectedFormat = '';
                    let type = 'video';

                    switch (selectedText.toLowerCase()) {
                        case '1':
                        case 'yt_360':
                            selectedFormat = "360p";
                            break;
                        case '2':
                        case 'yt_480':
                            selectedFormat = "480p";
                            break;
                        case '3':
                        case 'yt_720':
                            selectedFormat = "720p";
                            break;
                        case '4':
                        case 'yt_audio':
                            selectedFormat = "mp3";
                            type = 'audio';
                            break;
                        default:
                            return; // Ignore invalid input
                    }

                    try {
                        const apiRes = await axios.get("https://www.movanest.xyz/v2/dxz-ytdl", {
                            params: {
                                input: videoInfo.url,
                                format: selectedFormat === 'mp3' ? 'mp3' : selectedFormat,
                                your_api_key: "movanest-keySMAFE9R6ON"
                            }
                        });

                        if (!apiRes.data.status) throw new Error("API Error");

                        const results = apiRes.data.results;
                        let downloadUrl = '';

                        if (type === 'audio') {
                            const audioData = results.byFormat?.["mp3"]?.find(f => f.scraper === "ddownr" || f.scraper === "cobalt");
                            const anyAudio = audioData || results.byFormat?.["mp3"]?.[0];
                            downloadUrl = anyAudio?.url || anyAudio?.alternatives?.[0]?.url;
                        } else {
                            const videoData = results.byFormat?.[selectedFormat]?.find(
                                f => f.scraper === "ddownr" && Array.isArray(f.alternatives)
                            );
                            const fallback = results.byFormat?.[selectedFormat]?.[0];
                            if (videoData) {
                                const direct = videoData.alternatives.find(a => a.has_ssl) || videoData.alternatives[0];
                                downloadUrl = direct?.url;
                            } else if (fallback) {
                                downloadUrl = fallback.url;
                            }
                        }

                        if (!downloadUrl) {
                            return await conn.sendMessage(from, { text: `❌ Could not find ${selectedFormat} link. Try another quality.` }, { quoted: replyMek });
                        }

                        const bufferRes = await axios.get(downloadUrl, {
                            responseType: 'arraybuffer',
                            headers: { "User-Agent": "Mozilla/5.0" }
                        });

                        const mediaBuffer = Buffer.from(bufferRes.data);

                        if (mediaBuffer.length > 100 * 1024 * 1024) {
                            return await conn.sendMessage(from, { text: '❌ File too large (>100MB)!' }, { quoted: replyMek });
                        }

                        let msgContent = {};
                        if (type === 'audio') {
                            msgContent = {
                                audio: mediaBuffer,
                                mimetype: 'audio/mpeg',
                                ptt: false
                            };
                        } else {
                            msgContent = {
                                video: mediaBuffer,
                                mimetype: 'video/mp4',
                                caption: `╭──「 *${selectedFormat.toUpperCase()} VIDEO* 」──◆\n│ 🎬 ${videoInfo.title}\n╰─────────────────◆\n\n© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${botName}`
                            };
                        }

                        await conn.sendMessage(from, msgContent, { quoted: replyMek });
                        await conn.sendMessage(from, { react: { text: '✅', key: replyMek.key } });

                    } catch (err) {
                        console.error(err);
                        await conn.sendMessage(from, { text: '❌ Error Downloading: ' + err.message }, { quoted: replyMek });
                    }

                    conn.ev.off('messages.upsert', handleYouTubeSelection);
                }
            };

            conn.ev.on('messages.upsert', handleYouTubeSelection);

            // Timeout to remove listener to prevent memory leaks
            setTimeout(() => {
                conn.ev.off('messages.upsert', handleYouTubeSelection);
            }, 60000 * 2); // 2 minutes timeout for user to reply

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    })

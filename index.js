/**
 * popkid WhatsApp Bot (Advanced Version)
 * Creator: popkid
 * Features: auto-reconnect, error guards, LID-aware status handler, session loader, auto-bio, newsletter follow, anticall
 */

console.clear()
console.log("📳 Starting POPKID-MD...")

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
})
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason)
})

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { promisify } = require('util')
const zlib = require('zlib')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')

// ✅ ANTIDELETE IMPORT
const { AntideleteHandler } = require('./lib/antidelete')

const ownerNumber = ['254732297194']
const sessionDir = path.join(__dirname, 'sessions');

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) return
      })
    }
  })
}

setInterval(clearTempDir, 5 * 60 * 1000)

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) return console.log('Please add your session to SESSION_ID env !!')
  const sessdata = config.SESSION_ID.replace("POPKID;;;", '')
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)
  filer.download((err, data) => {
    if (err) throw err
    fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
      console.log("[ 📥 ] Session downloaded ✅")
    })
  })
}

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn // ✅ GLOBAL conn declaration

// ================= WA CONNECTION =================

async function connectToWA() {
  try {
    console.log("[ ♻ ] Connecting to WhatsApp ⏳️...")

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    })

    // ============ ANTICALL HANDLER ============
    conn.ev.on('call', async (node) => {
        if (config.ANTICALL === 'true') {
            const { from, id, status } = node[0]
            if (status === 'offer') {
                console.log(`📞 Declining call from: ${from}`)
                await conn.rejectCall(id, from)
                await conn.sendMessage(from, { text: "⚠️ *POPKID-MD AUTO-REJECT* ⚠️\n\nCalls are not allowed for this bot. Please send a text message instead." })
            }
        }
    })

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      if (qr) qrcode.generate(qr, { small: true })

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) setTimeout(() => connectToWA(), 5000)
      } else if (connection === 'open') {
          console.log('[ ❤️ ] Installing Plugins...')
          fs.readdirSync("./popkid/").forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === ".js") require("./popkid/" + plugin)
          })
          console.log('[ 🪀 ] Bot connected to WhatsApp ✅')

          let up = `╔════════════════╗\n║ 🤖 ▰𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗▰\n╠════════════════╣\n║ 🔑 PREFIX  : ${config.PREFIX}\n║ 👨‍💻 DEV     : POPKID-MD\n║ 📞 DEV NO : 254732297194\n╚════════════════╝`;
          conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/j9ia5c.png` }, caption: up })

          const channelJid = "120363423997837331@newsletter"
          try {
            await conn.newsletterFollow(channelJid)
            console.log(`success✅: ${channelJid}`)
          } catch (error) {
            console.error(`failed❎: ${error}`)
          }
      }
    })

    conn.ev.on('creds.update', saveCreds)

    // Bio Update Logic
    setInterval(async () => {
        if (config.AUTO_BIO === "true" && conn?.user) {
            const date = new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
            const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
            const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ 🤖 ɪs ʟɪᴠᴇ ɴᴏᴡ\n📅 ${date}\n⏰ ${time}`;
            try { await conn.setStatus(bioText); } catch (err) {}
        }
    }, 60000);

    conn.ev.on('messages.upsert', async(mek) => {
        mek = mek.messages[0]
        if (!mek.message) return
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        const from = mek.key.remoteJid
        const type = getContentType(mek.message)

        if (from === 'status@broadcast') {
            try {
                const shouldRead = config.AUTO_STATUS_SEEN === 'true' || config.AUTO_READ_STATUS === 'true';
                const shouldReact = config.AUTO_STATUS_REACT === 'true' || config.AUTO_REACT_STATUS === 'true';
                const statusParticipant = mek.key.participant || null;

                if (statusParticipant) {
                    let realJid = statusParticipant;
                    if (statusParticipant.endsWith('@lid')) {
                        const rawPn = mek.key?.participantPn || mek.key?.senderPn;
                        if (rawPn) {
                            realJid = rawPn.includes('@') ? rawPn : `${rawPn}@s.whatsapp.net`;
                        } else {
                            const resolved = await conn.getJidFromLid(statusParticipant).catch(() => null);
                            if (resolved) realJid = resolved;
                        }
                    }

                    const resolvedKey = { ...mek.key, participant: realJid };

                    if (shouldRead) await conn.readMessages([resolvedKey]);

                    if (shouldReact) {
                        const reactableTypes = ['imageMessage', 'videoMessage', 'extendedTextMessage', 'conversation', 'audioMessage'];
                        if (reactableTypes.includes(type)) {
                            const emojis = ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋', '🫀', '🧿', '🤖', '🚩', '🥰', '🗿'];
                            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                            await conn.sendMessage(from, { react: { key: resolvedKey, text: emoji } }, { statusJidList: [realJid, conn.user.id] });
                        }
                    }

                    if (config.AUTO_STATUS_REPLY === "true") {
                        await conn.sendMessage(realJid, { text: config.AUTO_STATUS_MSG }, { quoted: mek });
                    }
                }
            } catch (e) { console.error("Status Error:", e); }
        }

        if (config.READ_MESSAGE === 'true') await conn.readMessages([mek.key]);
        await saveMessage(mek);

        // ✅ ANTIDELETE HANDLER — called here for every message
        if (config.ANTIDELETE && config.ANTIDELETE !== 'false') {
            await AntideleteHandler(conn, mek)
        }

        const m = sms(conn, mek)
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        const isCmd = body.startsWith(config.PREFIX)
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const text = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || from)
        const senderNumber = sender.split('@')[0]
        const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe
        const pushname = mek.pushName || 'User'
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const participants = isGroup ? (groupMetadata.participants || []) : []
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : []
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek })

        if (isOwner && body.startsWith('%')) {
            try { reply(util.format(eval(body.slice(1)))); } catch (e) { reply(util.format(e)); }
        }
        if (isOwner && body.startsWith('$')) {
            try { 
                let evaled = await eval(`(async () => { ${body.slice(1)} })()`);
                if (evaled) reply(util.format(evaled));
            } catch (e) { reply(util.format(e)); }
        }

        if (!mek.key.fromMe && config.AUTO_REACT === 'true') {
            const emojis = ['🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🐋', '💥', '🥀'];
            m.react(emojis[Math.floor(Math.random() * emojis.length)]);
        }

        const events = require('./command')
        if (isCmd) {
            const cmd = events.commands.find((c) => c.pattern === command || (c.alias && c.alias.includes(command)))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
                try {
                    cmd.function(conn, mek, m, {from, body, isCmd, command, args, text, isGroup, sender, senderNumber, botNumber2, pushname, isOwner, groupMetadata, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                } catch (e) { console.error(e); }
            }
        }
    });

  } catch (err) { console.error("Connection failed:", err); }
}

app.get("/", (req, res) => res.send("POPKID-MD ACTIVE"));
app.listen(port, () => console.log(`Server on port ${port}`));
setTimeout(() => connectToWA(), 5000);

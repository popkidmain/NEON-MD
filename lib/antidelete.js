const config = require('../config');

// Initialize a global memory store to record messages
global.msgDb = global.msgDb || {};

/**
 * Saves every incoming message to memory so it can be restored if deleted.
 */
async function captureMessage(mek) {
    if (!mek.message || mek.key.remoteJid === 'status@broadcast') return;
    
    // Store message by its unique ID
    global.msgDb[mek.key.id] = mek;
    
    // Memory Clean-up: keeps only the last 500 messages to save RAM
    const keys = Object.keys(global.msgDb);
    if (keys.length > 500) delete global.msgDb[keys[0]];
}

/**
 * Detects 'Delete for Everyone' and resends the content.
 */
async function handleAntiDelete(conn, update) {
    // Check if the feature is toggled ON
    if (!global.antidelete) return;

    // Type 0 is the protocol for 'Delete for Everyone'
    if (update.protocolMessage && update.protocolMessage.type === 0) {
        const key = update.protocolMessage.key;
        const from = key.remoteJid;
        const deletedMsg = global.msgDb[key.id];

        if (!deletedMsg) return; // Not found in recent memory

        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
        const msgContent = deletedMsg.message.conversation || 
                           deletedMsg.message.extendedTextMessage?.text || 
                           "Media File (Image/Video/Voice)";

        // Branded Popkid Ke vCard
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "Popkid Ke",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:popkid\nORG:popkid;\nTEL;type=CELL;type=VOICE;waid=254111385747:+254111385747\nEND:VCARD`
                }
            }
        };

        const newsletterContext = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            }
        };

        // Resend the deleted message info
        await conn.sendMessage(from, { 
            text: `✨ *POPKID XMD ANTI-DELETE* ✨\n\n*User:* @${sender.split('@')[0]}\n*Message:* ${msgContent}`,
            mentions: [sender],
            contextInfo: newsletterContext 
        }, { quoted: fakevCard });

        // If the original message was media, forward the media itself
        if (deletedMsg.message.imageMessage || deletedMsg.message.videoMessage || deletedMsg.message.audioMessage) {
            await conn.copyNForward(from, deletedMsg, false, { contextInfo: newsletterContext });
        }
    }
}

module.exports = { captureMessage, handleAntiDelete };

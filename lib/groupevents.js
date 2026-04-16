const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363289379419860@newsletter',
            newsletterName: ' popkid🌟',
            serverMessageId: 143,
        },
    };
};

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        // Fetch Group Profile Picture once (Optimization)
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            // --- WELCOME SECTION ---
            if (update.action === "add" && config.WELCOME === "true") {
                const WelcomeText = `Hey @${userName} 👋\n` +
                    `Welcome🎉 to *${metadata.subject}*.\n` +
                    `You are member number ${groupMembersCount} in this group. 🙏\n` +
                    `Time joined: *${timestamp}*\n` +
                    `Please read the group description to avoid being removed:\n` +
                    `${desc}\n` +
                    `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid ᴛᴇᴄʜ 🌟*`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } 
            
            // --- GOODBYE SECTION --- (Now uses config.GOODBYE)
            else if (update.action === "remove" && config.GOODBYE === "true") {
                const GoodbyeText = `Goodbye @${userName}. 😔\n` +
                    `Another person left the group we will miss you\n` +
                    `Time left: *${timestamp}*\n` +
                    `The group now has ${groupMembersCount} members. 😭\n` +
                    `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid ᴛᴇᴄʜ 🌟*`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } 
            
            // --- ADMIN EVENTS ---
            else if (update.action === "demote" && config.ADMIN_EVENTS === "true") {
                const demoter = update.author ? update.author.split("@")[0] : "Admin";
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${demoter} has demoted @${userName} from admin. 👀\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author || num, num],
                    contextInfo: getContextInfo({ sender: update.author || num }),
                });

            } else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {
                const promoter = update.author ? update.author.split("@")[0] : "Admin";
                await conn.sendMessage(update.id, {
                    text: `*Admin Event*\n\n` +
                          `@${promoter} has promoted @${userName} to admin. 🎉\n` +
                          `Time: ${timestamp}\n` +
                          `*Group:* ${metadata.subject}`,
                    mentions: [update.author || num, num],
                    contextInfo: getContextInfo({ sender: update.author || num }),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;

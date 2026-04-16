const config = require('../config');
const linkWarnings = {}; 

const handleAntilink = async (conn, m, { isAdmins, isOwner }) => {
    if (config.ANTILINK === 'true' && m.isGroup && !isAdmins && !isOwner && !m.fromMe) {
        const body = m.body || m.msg.conversation || m.msg.text || "";
        const linkRegex = /chat.whatsapp.com\/|http:\/\/|https:\/\//i;

        if (linkRegex.test(body)) {
            const group = m.chat;
            const user = m.sender;
            const action = config.ANTILINK_ACTION || 'delete'; // default

            // --- ACTION: DELETE ---
            await conn.sendMessage(group, { delete: m.key });

            // --- ACTION: WARN ---
            if (action === 'warn') {
                const warnerId = `${group}-${user}`;
                linkWarnings[warnerId] = (linkWarnings[warnerId] || 0) + 1;
                
                if (linkWarnings[warnerId] >= 3) {
                    await conn.sendMessage(group, { text: `🚫 @${user.split('@')[0]} kicked for repeated links.`, mentions: [user] });
                    await conn.groupParticipantsUpdate(group, [user], "remove");
                    delete linkWarnings[warnerId];
                } else {
                    await conn.sendMessage(group, { 
                        text: `⚠️ *Link Detected!* @${user.split('@')[0]}\n*Warning:* ${linkWarnings[warnerId]}/3`,
                        mentions: [user] 
                    });
                }
            }

            // --- ACTION: KICK (Instant) ---
            if (action === 'kick') {
                await conn.sendMessage(group, { text: `🚫 @${user.split('@')[0]} has been kicked for sending a link.`, mentions: [user] });
                await conn.groupParticipantsUpdate(group, [user], "remove");
            }
            
            return true;
        }
    }
    return false;
};

module.exports = { handleAntilink };

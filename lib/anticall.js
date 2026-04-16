const config = require('../config')

/**
 * Handles incoming call data and rejects it if enabled.
 */
async function handleAnticall(conn, callData) {
    if (config.ANTICALL !== 'true') return;

    for (const call of callData) {
        if (call.status === 'offer') {
            const from = call.from;
            console.log(`[ 🚫 ANTICALL ] Rejecting call from: ${from}`);

            // Reject the call immediately
            await conn.rejectCall(call.id, from);

            // Notify the user
            const msg = "⚠️ *POPKID-MD ANTI-CALL*\n\nCalls are strictly prohibited. Please message instead of calling.";
            await conn.sendMessage(from, { text: msg });

            // Optional: Block the user to prevent spam
            // await conn.updateBlockStatus(from, 'block');
        }
    }
}

module.exports = { handleAnticall };

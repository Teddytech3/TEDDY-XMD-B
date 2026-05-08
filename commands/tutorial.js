const settings = require("../settings");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Uptime formatter
function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function tutorialCommand(sock, chatId, message) {
    try {
        // ❤️ Reaction when command triggered
        await sock.sendMessage(chatId, {
            react: {
                text: "📸",
                key: message.key
            }
        });

        const userName = message.pushName || "User";
        const botUptime = runtime(process.uptime());
        const totalMemory = (os.totalmem() / (1024 * 1024)).toFixed(2);
        const usedMemory = (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2);
        const host = os.platform();

        const botName = settings.botName || global.botname || "TEDDY-XMD";
        const ownerName = settings.ownerName || "Teddy Tech";

        const tutorialMessage =
            `👋 \`Hello ${userName}, TEDDY-XMD deployment tutorials\` \n\n` +
            `*${botName} is easy to deploy on multiple platforms*\n\n` +
            `*📹 Deployment Tutorials:*\n` +
            `• *GitHub Workflows:* coming soon\n` +
            `• *Katabump:* coming soon\n` +
            `• *Bot Hosting Panel:* coming soon\n` +
            `• *Heroku:* coming soon\n` +
            `• *Termux:* coming soon\n\n` +
            `*⚡ ${botName} Status:*\n` +
            `• Uptime: ${botUptime}\n` +
            `• Platform: ${host}\n` +
            `• RAM: ${usedMemory}MB / ${totalMemory}GB\n\n` +
            `*🧚 Join our channels:*\n` +
            `• WhatsApp: https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n\n` +
            `• Telegram: t.me/xdbot1\n` +
            `• Group: t.me/free_net_zone2\n\n` +
            `> ρσωєяє∂ ву ${ownerName}`;

        // Resolve the local image path
        const imagePath = path.resolve(__dirname, "../assets/menu1.jpg");

        // Check if image exists before sending
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: tutorialMessage
            }, { quoted: message });
        } else {
            // Fallback to text if image missing
            await sock.sendMessage(chatId, {
                text: tutorialMessage + `\n\n⚠️ *Note: Tutorial banner image not found*`
            }, { quoted: message });
        }

    } catch (error) {
        console.error("Error in tutorial command:", error);

        const fallbackText = `❌ *Tutorials coming soon*\n\n` +
            `> Contact owner for updates`;

        await sock.sendMessage(chatId, {
            text: fallbackText
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            react: { text: "⚠️", key: message.key }
        });
    }
}

module.exports = tutorialCommand;
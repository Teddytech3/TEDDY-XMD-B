const os = require('os');
const fs = require('fs');
const path = require('path');
const { getBotName } = require('../lib/botConfig');
const settings = require('../settings');
const { createFakeContact } = require('../lib/fakeContact');

const botStartTime = Date.now();

const detectPlatform = () => {
    if (process.env.DYNO) return '☁️ Heroku';
    if (process.env.RENDER) return '⚡ Render';
    if (process.env.PREFIX && process.env.PREFIX.includes('termux')) return '📱 Termux';
    if (process.env.PORTS && process.env.CYPHERX_HOST_ID) return '🌀 CypherX Platform';
    if (process.env.P_SERVER_UUID) return '🖥️ Panel';
    if (process.env.LXC) return '🐦‍⬛ Linux Container (LXC)';
    switch (os.platform()) {
        case 'win32': return '🪟 Windows';
        case 'darwin': return '🍎 macOS';
        case 'linux': return '🐧 Linux';
        default: return '❓ Unknown';
    }
};

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} GB`;
}

async function loadThumbnail(thumbnailPath) {
    try {
        if (fs.existsSync(thumbnailPath)) {
            return fs.readFileSync(thumbnailPath);
        } else {
            return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        }
    } catch (error) {
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    }
}

async function botInfoCommand(sock, chatId, message) {
    try {
        const uptime = Date.now() - botStartTime;
        const platform = detectPlatform();
        const botName = settings.botName || global.botname || "TEDDY-XMD";
        const version = settings.version || '1.0.0';
        const ownerNumber = settings.ownerNumber || '254701722487';
        const botOwner = settings.botOwner || settings.ownerName || 'Teddy Tech';
        const commandMode = settings.commandMode || 'public';

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

        const cpus = os.cpus();
        const cpuModel = cpus.length > 0? cpus[0].model.trim() : 'Unknown';
        const cpuCores = cpus.length;

        const nodeVersion = process.version;
        const arch = os.arch();
        const hostname = os.hostname();
        const osType = `${os.type()} ${os.release()}`;

        const text = `
┏❐ *❴ ${botName} INFO ❵* ❐

🔷 *Bot Details:*
┃➥ *Name:* ${botName}
┃➥ *Version:* v${version}
┃➥ *Owner:* ${botOwner}
┃➥ *Owner Number:* +${ownerNumber}
┃➥ *Mode:* ${commandMode}
┃➥ *Uptime:* ${formatUptime(uptime)}

🔶 *Server Info:*
┃➥ *Platform:* ${platform}
┃➥ *OS:* ${osType}
┃➥ *Architecture:* ${arch}
┃➥ *Hostname:* ${hostname}
┃➥ *Node.js:* ${nodeVersion}

⚙️ *CPU:*
┃➥ *Model:* ${cpuModel}
┃➥ *Cores:* ${cpuCores}

💾 *Memory:*
┃➥ *Total:* ${formatBytes(totalMem)}
┃➥ *Used:* ${formatBytes(usedMem)} (${memPercent}%)
┃➥ *Free:* ${formatBytes(freeMem)}
┗❐

> ρσωєяє∂ ву ${botOwner}`.trim();

        const imgPath = path.resolve(__dirname, "../assets/menu1.jpg");
        const thumbnailBuffer = await loadThumbnail(imgPath);

        const buttons = [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "⭐ GitHub Repo",
                    url: "https://github.com/Teddytech1/TEDDY-XMD",
                    merchant_url: "https://github.com/Teddytech1/TEDDY-XMD"
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "📢 Channel",
                    url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n",
                    merchant_url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n"
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 Menu",
                    id: ".menu"
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📊 Ping",
                    id: ".ping"
                })
            }
        ];

        await sock.sendMessage(chatId, {
            image: thumbnailBuffer,
            caption: text,
            footer: `> ${botName} • Fast & Secure`,
            buttons: buttons,
            headerType: 4,
            viewOnce: true,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421104812135@newsletter',
                    newsletterName: 'TEDDY-XMD Official',
                    serverMessageId: -1
                }
            }
        }, { quoted: createFakeContact(message) });

    } catch (error) {
        console.error('Error in botinfo command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch bot information.'
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = botInfoCommand;
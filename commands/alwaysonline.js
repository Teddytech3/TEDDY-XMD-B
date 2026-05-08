const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { createFakeContact } = require('../lib/fakeContact');
const settings = require('../settings');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'alwaysonline.json');

let presenceInterval = null;

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            const def = { enabled: false };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(def, null, 2));
            return def;
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
        return { enabled: false };
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('[AlwaysOnline] Failed to save config:', e.message);
    }
}

function startPresenceBroadcast(sock) {
    stopPresenceBroadcast();
    presenceInterval = setInterval(async () => {
        try {
            await sock.sendPresenceUpdate('available');
        } catch (e) {
            // Silently ignore transient presence errors
        }
    }, 10000);
}

function stopPresenceBroadcast() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}

function getArg(message) {
    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        '';
    return text.trim().split(/\s+/)[1]?.toLowerCase() || null;
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

async function alwaysonlineCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId);

        if (!message.key.fromMe &&!isOwner) {
            return sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!'
            }, { quoted: createFakeContact(message) });
        }

        const arg = getArg(message);
        const config = loadConfig();
        const botName = settings.botName || global.botname || "TEDDY-XMD";
        const ownerName = settings.ownerName || settings.botOwner || "Teddy Tech";

        const imgPath = path.resolve(__dirname, "../assets/menu1.jpg");
        const thumbnailBuffer = await loadThumbnail(imgPath);

        if (!arg) {
            const status = config.enabled? '✅ ON' : '❌ OFF';
            const statusText = `┏❐ *❴ ${botName} ALWAYS ONLINE ❵* ❐\n` +
                              `┃➥ *Status:* ${status}\n` +
                              `┃➥ *Owner:* ${ownerName}\n` +
                              `┗❐\n\n` +
                              `*Usage:*.alwaysonline on | off\n\n` +
                              `• *on* — Always appear online to everyone\n` +
                              `• *off* — Go offline & hide last seen / online status\n\n` +
                              `> ρσωєяє∂ ву ${ownerName}`;

            const buttons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "✅ Enable",
                        id: ".alwaysonline on"
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "❌ Disable",
                        id: ".alwaysonline off"
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📢 Channel",
                        url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n",
                        merchant_url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n"
                    })
                }
            ];

            return sock.sendMessage(chatId, {
                image: thumbnailBuffer,
                caption: statusText,
                footer: `> ${botName} • Privacy Settings`,
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
        }

        if (arg === 'on') {
            config.enabled = true;
            saveConfig(config);

            startPresenceBroadcast(sock);

            try { await sock.updateLastSeenPrivacy('all'); } catch (e) {
                console.error('[AlwaysOnline] updateLastSeenPrivacy error:', e.message);
            }
            try { await sock.updateOnlinePrivacy('all'); } catch (e) {
                console.error('[AlwaysOnline] updateOnlinePrivacy error:', e.message);
            }

            const text = `┏❐ *❴ ${botName} ALWAYS ONLINE ❵* ❐\n` +
                        `┃➥ *Status:* ✅ ENABLED\n` +
                        `┃➥ *Mode:* Online Broadcast\n` +
                        `┗❐\n\n` +
                        `✅ *Always Online activated*\n\n` +
                        `The bot will continuously broadcast an online presence.\n` +
                        `Last seen and online status are now visible to everyone.\n\n` +
                        `> ρσωєяє∂ ву ${ownerName}`;

            return sock.sendMessage(chatId, {
                image: thumbnailBuffer,
                caption: text,
                footer: `> ${botName} • Privacy Settings`,
                headerType: 4,
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
        }

        if (arg === 'off') {
            config.enabled = false;
            saveConfig(config);

            stopPresenceBroadcast();

            try { await sock.sendPresenceUpdate('unavailable'); } catch (e) {
                console.error('[AlwaysOnline] sendPresenceUpdate error:', e.message);
            }
            try { await sock.updateLastSeenPrivacy('none'); } catch (e) {
                console.error('[AlwaysOnline] updateLastSeenPrivacy error:', e.message);
            }
            try { await sock.updateOnlinePrivacy('match_last_seen'); } catch (e) {
                console.error('[AlwaysOnline] updateOnlinePrivacy error:', e.message);
            }

            const text = `┏❐ *❴ ${botName} ALWAYS ONLINE ❵* ❐\n` +
                        `┃➥ *Status:* ❌ DISABLED\n` +
                        `┃➥ *Mode:* Offline\n` +
                        `┗❐\n\n` +
                        `✅ *Always Online deactivated*\n\n` +
                        `Online presence broadcast stopped.\n` +
                        `🔒 Last seen hidden from everyone.\n` +
                        `🔒 Online status hidden (grey ticks concealed).\n\n` +
                        `> ρσωєяє∂ ву ${ownerName}`;

            return sock.sendMessage(chatId, {
                image: thumbnailBuffer,
                caption: text,
                footer: `> ${botName} • Privacy Settings`,
                headerType: 4,
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
        }

        return sock.sendMessage(chatId, {
            text: '❌ Invalid option! Usage:.alwaysonline on | off'
        }, { quoted: createFakeContact(message) });

    } catch (err) {
        console.error('[AlwaysOnline] Error:', err.message);
        return sock.sendMessage(chatId, {
            text: '❌ Failed to update always online setting.'
        }, { quoted: createFakeContact(message) });
    }
}

async function applyAlwaysOnlineOnStartup(sock) {
    try {
        const config = loadConfig();
        if (config.enabled) {
            startPresenceBroadcast(sock);
            try { await sock.updateLastSeenPrivacy('all'); } catch (e) {
                console.error('[AlwaysOnline] Startup updateLastSeenPrivacy error:', e.message);
            }
            try { await sock.updateOnlinePrivacy('all'); } catch (e) {
                console.error('[AlwaysOnline] Startup updateOnlinePrivacy error:', e.message);
            }
            console.log('[AlwaysOnline] Resumed — broadcasting online presence.');
        }
    } catch (e) {
        console.error('[AlwaysOnline] Startup apply error:', e.message);
    }
}

module.exports = { alwaysonlineCommand, applyAlwaysOnlineOnStartup };
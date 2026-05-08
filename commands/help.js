/**
- help.js -
- TEDDY-XMD Material Menu with Buttons + Back Navigation
*/
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getMenuStyle, getMenuSettings, MENU_STYLES } = require('./menuSettings');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { getPrefix, handleSetPrefixCommand } = require('./setprefix');
const { getOwnerName, handleSetOwnerCommand } = require('./setowner');
const setBotNameCommand = require('./setbotname');
const { getBotName } = require('../lib/botConfig');
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// Utility Functions
const { createFakeContact } = require('../lib/fakeContact');
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

// Detect host/platform
const detectPlatform = () => {
  if (process.env.DYNO) return "Heroku";
  if (process.env.RENDER) return "Render";
  if (process.env.PREFIX && process.env.PREFIX.includes("termux")) return "Termux";
  if (process.env.P_SERVER_UUID) return "Panel";

  switch (os.platform()) {
    case "win32": return "Windows";
    case "darwin": return "macOS";
    case "linux": return "Linux";
    default: return "Unknown";
  }
};

// Memory formatting function
const formatMemory = (memory) => {
    return memory < 1024 * 1024 * 1024
     ? Math.round(memory / 1024 / 1024) + ' MB'
        : Math.round(memory / 1024) + ' GB';
};

// Progress bar function
const progressBar = (used, total, size = 12) => {
    let percentage = Math.round((used / total) * size);
    let bar = '▰'.repeat(percentage) + '▱'.repeat(size - percentage);
    return `${bar} ${Math.round((used / total) * 100)}%`;
};

// FULL COMMAND LIST
const COMMAND_CATEGORIES = {
    '👑 OWNER': [
        'mode', 'autostatus', 'antidelete', 'autoread', 'autotyping',
        'autoreact', 'areact', 'autoreaction', 'autofont', 'autorecording',
        'autoboth', 'pmblocker', 'setpp', 'setbio', 'clearsession', 'cleartmp',
        'sudo', 'setprefix', 'setowner', 'setbotname', 'setmenu', 'restart',
        'menuimage', 'configimage', 'settings', 'update', 'paircode',
        'anticall', 'antibot', 'antiedit', 'antistatusmention', 'alwaysonline', 'online',
        'disp', 'readreciepts', 'settimezone'
    ],
    '🛡️ GROUP ADMIN': [
        'promote', 'demote', 'kick', 'mute', 'unmute', 'ban', 'unban',
        'warn', 'warnings', 'add', 'approve', 'join', 'killall',
        'antilink', 'antibadword', 'antitag', 'antisticker', 'antidemote',
        'antiimage', 'antimention', 'antipromote', 'welcome', 'goodbye',
        'setgroupdesc', 'setgname', 'setgpp', 'open', 'close',
        'resetlink', 'link', 'revoke'
    ],
    '👥 GROUP TOOLS': [
        'tagall', 'tag', 'hidetag', 'tagnoadmin', 'tagnotadmin', 'mention',
        'groupinfo', 'infogroup', 'admins', 'listadmin', 'listonline',
        'topmembers', 'leave', 'pair', 'chatbot', 'clear', 'delete',
        'getpp', 'lastseen', 'drop', 'getgcprofile', 'getgcname',
        'staff', 'creategroup'
    ],
    '🤖 AI': [
        'ai', 'gpt', 'gemini', 'copilot', 'deepseek', 'meta', 'metai',
        'vision', 'analyse', 'ilama', 'wormgpt', 'birdai', 'blackbox',
        'perplexity', 'mistral', 'grok', 'speechwrite',
        'imagine', 'flux', 'dalle', 'sora', 'magicstudio', 'remini', 'gptedit'
    ],
    '📥 DOWNLOADER': [
        'play', 'song', 'video', 'ytplay', 'ytv', 'ytaudio', 'ytvideo',
        'ytdocplay', 'ytdocvideo', 'spotify',
        'instagram', 'facebook', 'tiktok', 'xvideo',
        'mediafire', 'mf', 'apk', 'gitclone',
        'lyrics', 'whatsong', 'pinterest', 'terabox'
    ],
    '🔍 SEARCH & TOOLS': [
        'yts', 'ytsearch', 'img', 'image', 'movie', 'shazam',
        'fetch', 'ss', 'trt', 'transcribe', 'translate',
        'locate', 'location', 'url', 'tourl', 'vcf',
        'ping', 'runtime', 'uptime', 'alive', 'vv2',
        'block', 'unblock', 'allblocklist',
        'enc', 'viewonce', 'weather', 'news', 'inspect',
        'botinfo', 'time', 'date', 'chanelid', 'gif'
    ],
    '🎭 STICKER': [
        'sticker', 'stickercrop', 'tgsticker', 'take', 'attp', 'emojimix',
        'meme', 'smeme', 'blur', 'removebg', 'nobg', 'crop', 'simage', 'toimage'
    ],
    '🔄 CONVERTER': [
        'totext', 'toimage', 'toaudio', 'tomp3', 'toppt', 'tourl',
        'tovoicenote', 'trim', 'tts'
    ],
    '🎮 GAME': [
        'tictactoe', 'connect4', 'hangman', 'trivia', 'answer',
        'truth', 'dare', '8ball', 'cf', 'scramble', 'bet'
    ],
    '😂 FUN & SOCIAL': [
        'compliment', 'insult', 'flirt', 'shayari', 'goodnight', 'gn',
        'roseday', 'lovenight', 'character', 'rate', 'ship', 'simp', 'wasted', 'stupid',
        'joke', 'quote', 'fact', 'oogway', 'pies', 'say'
    ],
    '🎌 ANIME': [
        'neko', 'waifu', 'loli', 'nom', 'poke', 'cry',
        'kiss', 'pat', 'hug', 'wink', 'facepalm', 'anime', 'animu'
    ],
    '✨ TEXT MAKER': [
        'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light',
        'neon', 'devil', 'purple', 'thunder', 'leaves', '1917',
        'arena', 'hacker', 'sand', 'blackpink', 'glitch', 'fire'
    ],
    '🖼️ IMG EDIT': [
        'heart', 'horny', 'circle', 'lgbt', 'lolice',
        'namecard', 'tweet', 'ytcomment', 'comrade',
        'gay', 'glass', 'jail', 'passed', 'triggered'
    ],
    '📱 STATUS': [
        'tostatus', 'savestatus', 'togroupstatus'
    ],
    '⚽ SPORTS': [
        'livescore', 'bettips', 'fnews',
        'player', 'team', 'venue', 'gameevents',
        'epl', 'laliga', 'ucl', 'bundesliga',
        'seriea', 'euros', 'fifa'
    ],
    '💻 GITHUB': [
        'git', 'github', 'sc', 'script', 'repo', 'clone'
    ]
};

// Material Design Menu - ALL COMMANDS
const generateMenu = (pushname, currentMode, hostName, ping, uptimeFormatted, prefix = '.') => {
    const memoryUsage = process.memoryUsage();
    const botUsedMemory = memoryUsage.heapUsed;
    const totalMemory = os.totalmem();
    const systemUsedMemory = totalMemory - os.freemem();
    const prefix2 = getPrefix();
    const bot = getBotName();
    let newOwner = getOwnerName();

    let menu = `╭─「 *${bot}* 」\n`;
    menu += `│\n`;
    menu += `│ 👤 *User:* ${pushname}\n`;
    menu += `│ ⚡ *Prefix:* ${prefix2}\n`;
    menu += `│ 👑 *Owner:* ${newOwner}\n`;
    menu += `│ 🔰 *Mode:* ${currentMode}\n`;
    menu += `│ 🖥️ *Platform:* ${hostName}\n`;
    menu += `│ 🚀 *Speed:* ${ping}ms\n`;
    menu += `│ ⏱️ *Uptime:* ${uptimeFormatted}\n`;
    menu += `│ 📦 *Version:* v${settings.version}\n`;
    menu += `│ 💾 *RAM:* ${formatMemory(botUsedMemory)} / ${formatMemory(totalMemory)}\n`;
    menu += `│ ${progressBar(systemUsedMemory, totalMemory)}\n`;
    menu += `│\n`;
    menu += `╰────────────────\n${readmore}\n`;

    let sectionIndex = 0;
    for (const [category, commands] of Object.entries(COMMAND_CATEGORIES)) {
        menu += `╭─「 *${category}* 」 *[${commands.length}]*\n`;
        for (const cmd of commands) {
            menu += `│ ▢ ${prefix2}${cmd}\n`;
        }
        menu += `╰────────────────\n`;
        sectionIndex++;
        if (sectionIndex % 3 === 0) {
            menu += `${readmore}\n`;
        } else {
            menu += `\n`;
        }
    }

    menu += `╭─「 *NAVIGATION* 」\n`;
    menu += `│ ↩️ Click buttons below to navigate\n`;
    menu += `╰────────────────\n`;
    menu += `\n⚡ *Powered by TEDDY-XMD*`;

    return menu;
};

// Helper function to safely load thumbnail
async function loadThumbnail(thumbnailPath) {
    try {
        if (thumbnailPath && (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://'))) {
            try {
                const fetch = require('node-fetch');
                const response = await fetch(thumbnailPath);
                if (response.ok) {
                    return Buffer.from(await response.arrayBuffer());
                }
            } catch (urlError) {
                console.error('URL thumbnail fetch failed:', urlError.message);
            }
        }

        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            return fs.readFileSync(thumbnailPath);
        }

        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    } catch (error) {
        console.error('Error loading thumbnail:', error.message);
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    }
}

// TEDDY-XMD menu with BUTTONS
async function sendMenuWithButtons(sock, chatId, message, menulist, thumbnailBuffer, pushname) {
    const botname = getBotName();
    const prefix = getPrefix();
    const plink = "https://github.com/Teddytech1/TEDDY-XMD";

    const buttons = [
        { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 Ping' }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: '👑 Owner' }, type: 1 },
        { buttonId: `${prefix}sc`, buttonText: { displayText: '💻 Script' }, type: 1 }
    ];

    const buttonMessage = {
        image: thumbnailBuffer,
        caption: menulist,
        footer: `© ${botname} • Material Design`,
        buttons: buttons,
        headerType: 4,
        contextInfo: {
            externalAdReply: {
                showAdAttribution: false,
                title: botname,
                body: `Material Design • ${pushname}`,
                thumbnail: thumbnailBuffer,
                sourceUrl: plink,
                mediaType: 1,
                renderLargerThumbnail: true,
            },
        },
    };

    await sock.sendMessage(chatId, buttonMessage, { quoted: createFakeContact(message) });
}

// Main help command function
async function helpCommand(sock, chatId, message, args = []) {
    const pushname = message.pushName || "Unknown User";
    const prefix = getPrefix();

    const start = Date.now();
    await sock.sendMessage(chatId, {
        text: '⚡ Loading Menu...'
    }, { quoted: createFakeContact(message) });
    const end = Date.now();
    const ping = Math.round((end - start) / 2);

    await sock.sendMessage(chatId, {
        react: { text: '⚡', key: message.key }
    });

    const uptimeInSeconds = process.uptime();
    const uptimeFormatted = formatTime(uptimeInSeconds);

    let botModeData = { mode: 'public', isPublic: true };
    try {
        const modeFilePath = path.join(__dirname, '../data/messageCount.json');
        const raw = JSON.parse(fs.readFileSync(modeFilePath, 'utf8'));
        if (raw && raw.mode) botModeData = raw;
    } catch (_) {}
    const modeMap = { public: 'Public', private: 'Private', group: 'Group', pm: 'PM' };
    const rawMode = (botModeData.mode || (botModeData.isPublic? 'public' : 'private')).toLowerCase();
    const currentMode = modeMap[rawMode] || rawMode.charAt(0).toUpperCase() + rawMode.slice(1);
    const hostName = detectPlatform();

    const menulist = generateMenu(pushname, currentMode, hostName, ping, uptimeFormatted, prefix);

    const { getMenuImage } = require('../lib/botConfig');
    const customMenuImage = getMenuImage();
    let thumbnailPath;

    if (customMenuImage) {
        thumbnailPath = customMenuImage;
    } else {
        thumbnailPath = path.join(__dirname, '../assets', 'menu1.jpg');
    }

    try {
        const thumbnailBuffer = await loadThumbnail(thumbnailPath);
        await sendMenuWithButtons(sock, chatId, message, menulist, thumbnailBuffer, pushname);

    } catch (error) {
        console.error('Error in help command:', error);
        try {
            await sock.sendMessage(chatId, {
                text: menulist
            }, { quoted: createFakeContact(message) });
        } catch (fallbackError) {
            console.error('Even fallback failed:', fallbackError);
        }
    }
}

module.exports = helpCommand;
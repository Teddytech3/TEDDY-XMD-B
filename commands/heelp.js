// help.js - TEDDY-XMD with Buttons
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getMenuStyle, getMenuSettings, MENU_STYLES } = require('./menuSettings');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getPrefix, handleSetPrefixCommand } = require('./setprefix');
const { getBotName } = require('../lib/botConfig');
const { getOwnerName, handleSetOwnerCommand } = require('./setowner');

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

function detectHost() {
    const env = process.env;
    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render';
    if (env.DYNO || env.HEROKU_APP_DIR || env.HEROKU_SLUG_COMMIT) return 'Heroku';
    if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL) return 'Vercel';
    if (env.PORTS || env.CYPHERX_HOST_ID) return "CypherXHost";
    if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID) return 'Railway';
    if (env.REPL_ID || env.REPL_SLUG) return 'Replit';
    const hostname = os.hostname().toLowerCase();
    if (!env.CLOUD_PROVIDER && !env.DYNO && !env.VERCEL && !env.RENDER) {
        if (hostname.includes('vps') || hostname.includes('server')) return 'VPS';
        return 'Panel';
    }
    return 'Unknown Host';
}

const formatMemory = (memory) => {
    return memory < 1024 * 1024
        ? Math.round(memory / 1024 / 1024) + ' MB'
        : (memory / 1024 / 1024).toFixed(2) + ' GB';
};

const progressBar = (used, total, size = 10) => {
    let percentage = Math.round((used / total) * size);
    let bar = '█'.repeat(percentage) + '░'.repeat(size - percentage);
    return `${bar} ${Math.round((used / total) * 100)}%`;
};

// Main Menu with All Commands
const generateMenu = (pushname, currentMode, hostName, ping, uptimeFormatted, prefix = '.') => {
    const memoryUsage = process.memoryUsage();
    const botUsedMemory = memoryUsage.heapUsed;
    const totalMemory = os.totalmem();
    const systemUsedMemory = totalMemory - os.freemem();
    const prefix2 = getPrefix();
    let newOwner = getOwnerName() || "Teddy Tech";
    const menuSettings = getMenuSettings();
    const botName = settings.botName || global.botname || "TEDDY-XMD";
    
    let menu = `┏❐  *❴ ${botName} ❵* ❐\n`;
    menu += `┃➥ *User:* ${pushname}\n`;
    menu += `┃➥ *Owner:* ${newOwner}\n`;
    menu += `┃➥ *Mode:* ${currentMode}\n`;
    menu += `┃➥ *Host:* ${hostName}\n`;
    menu += `┃➥ *Speed:* ${ping} ms\n`;
    menu += `┃➥ *Prefix:* [${prefix2}]\n`;
    
    if (menuSettings.showUptime) {
        menu += `┃➥ *Uptime:* ${uptimeFormatted}\n`;
    }
    
    menu += `┃➥ *version:* v${settings.version || '1.0.0'}\n`;
    
    if (menuSettings.showMemory) {
        menu += `┃➥ *Usage:* ${formatMemory(botUsedMemory)} of ${formatMemory(totalMemory)}\n`;
        menu += `┃➥ *RAM:* ${progressBar(systemUsedMemory, totalMemory)}\n`;
    }
    
    menu += `┗❐\n${readmore}\n`;

    // Owner Menu
    menu += `┏❐ \`OWNER MENU\` ❐\n`;
    menu += `┃ .ban .unban .restart .promote .demote\n┃ .mute .unmute .delete .kick .warnings\n┃ .antilink .antibadword .clear .chatbot\n┃ .setowner .setprefix .setmenu .setpp\n┃ .getpp .sudo .autoreact .autotyping\n`;
    menu += `┗❐\n\n`;

    // Group Menu
    menu += `┏❐ \`GROUP MENU\` ❐\n`;
    menu += `┃ .promote .demote .settings .welcome\n┃ .setgpp .getgpp .listadmin .goodbye\n┃ .tagnoadmin .tag .tagall .antilink\n┃ .set welcome .groupinfo .admins .warn\n┃ .revoke .resetlink .open .close .mention\n`;
    menu += `┗❐\n\n`;

    // AI Menu
    menu += `┏❐ \`AI MENU\` ❐\n`;
    menu += `┃ .ai .gpt .gemini .imagine .flux\n┃ .blackbox .bard .claude .llama\n`;
    menu += `┗❐\n\n`;

    // Setting Menu
    menu += `┏❐ \`SETTING MENU\` ❐\n`;
    menu += `┃ .mode .autostatus .pmblock .setmention\n┃ .autoread .clearsession .antidelete\n┃ .cleartmp .autoreact .autotyping\n`;
    menu += `┗❐\n${readmore}\n`;

    // Main Menu
    menu += `┏❐ \`MAIN MENU\` ❐\n`;
    menu += `┃ .url .yts .play .spotify .trt .alive\n┃ .ping .apk .vv .video .song .ssweb\n┃ .instagram .facebook .tiktok .ytmp4\n┃ .ytmp3 .git .github .sc .script .repo\n`;
    menu += `┗❐\n\n`;

    // Stick Menu
    menu += `┏❐ \`STICK MENU\` ❐\n`;
    menu += `┃ .blur .simage .sticker .tgsticker\n┃ .meme .take .emojimix .qc .attp\n`;
    menu += `┗❐\n\n`;

    // Game Menu
    menu += `┏❐ \`GAME MENU\` ❐\n`;
    menu += `┃ .tictactoe .hangman .guess .trivia\n┃ .answer .truth .dare .8ball .slot\n`;
    menu += `┗❐\n\n`;

    // Maker Menu
    menu += `┏❐ \`MAKER MENU\`❐\n`;
    menu += `┃ .compliment .insult .flirt .shayari\n┃ .goodnight .roseday .character .wasted\n┃ .ship .simp .stupid .gay .lesbian\n`;
    menu += `┗❐\n\n`;

    // Anime Menu
    menu += `┏❐ \`ANIME MENU\` ❐\n`;
    menu += `┃ .neko .waifu .loli .nom .poke .cry\n┃ .kiss .pat .hug .wink .facepalm .slap\n`;
    menu += `┗❐\n\n`;

    // Text Maker Menu
    menu += `┏❐ \`TEXT MAKER\` ❐\n`;
    menu += `┃ .metallic .ice .snow .impressive\n┃ .matrix .light .neon .devil .purple\n┃ .thunder .leaves .1917 .arena .hacker\n┃ .sand .blackpink .glitch .fire .stone\n`;
    menu += `┗❐\n\n`;

    // Image Edit Menu
    menu += `┏❐ \`IMG EDIT\` ❐\n`;
    menu += `┃ .heart .horny .circle .lgbt .lolice\n┃ .stupid .namecard .tweet .ytcomment\n┃ .comrade .gay .glass .jail .passed\n┃ .triggered .wanted .wasted .beautiful\n`;
    menu += `┗❐\n\n`;
    
    menu += `> ρσωєяє∂ ву ${newOwner}`;

    return menu;
};

async function loadThumbnail(thumbnailPath) {
    try {
        if (fs.existsSync(thumbnailPath)) {
            return fs.readFileSync(thumbnailPath);
        } else {
            return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        }
    } catch (error) {
        console.error('Error loading thumbnail:', error);
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    }
}

// Send Menu with Buttons
async function sendMenuWithButtons(sock, chatId, message, menulist, thumbnailBuffer) {
    const fkontak = createFakeContact(message);
    const botname = settings.botName || global.botname || "TEDDY-XMD";
    const plink = "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n";
    const prefix = getPrefix();

    const buttons = [
        {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "📢 Channel",
                url: plink,
                merchant_url: plink
            })
        },
        {
            name: "cta_url", 
            buttonParamsJson: JSON.stringify({
                display_text: "💬 Group",
                url: "https://t.me/teddy-xmd",
                merchant_url: "https://t.me/teddy-xmd"
            })
        },
        {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "⭐ GitHub",
                url: "https://github.com/Teddytech1/TEDDY-XMD",
                merchant_url: "https://github.com/Teddytech1/TEDDY-XMD"
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🤖 Owner",
                id: `${prefix}owner`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "📊 Ping",
                id: `${prefix}ping`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "⚙️ Settings",
                id: `${prefix}settings`
            })
        }
    ];

    await sock.sendMessage(chatId, {
        image: thumbnailBuffer,
        caption: menulist,
        footer: `> ${botname} • Type ${prefix}menu for help`,
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
    }, { quoted: fkontak });
}

// Main help command function
async function helpCommand(sock, chatId, message) {
    const pushname = message.pushName || "Unknown User"; 

    let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    
    const start = Date.now();
    await sock.sendMessage(chatId, { 
        text: '_Loading TEDDY-XMD menu..._' 
    }, { quoted: createFakeContact(message) });
    const end = Date.now();
    const ping = Math.round((end - start) / 2);

    const uptimeInSeconds = process.uptime();
    const uptimeFormatted = formatTime(uptimeInSeconds);
    const currentMode = data.isPublic ? 'public' : 'private';    
    const hostName = detectHost();
    
    const menulist = generateMenu(pushname, currentMode, hostName, ping, uptimeFormatted);
    const thumbnailPath = path.join(__dirname, '../assets/menu1.jpg');

    await sock.sendMessage(chatId, {
        react: { text: '📔', key: message.key }
    });

    try {
        const thumbnailBuffer = await loadThumbnail(thumbnailPath);
        await sendMenuWithButtons(sock, chatId, message, menulist, thumbnailBuffer);

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

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
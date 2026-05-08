const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const { createFakeContact } = require('../lib/fakeContact');
const settings = require('../settings');

async function githubCommand(sock, chatId, message) {
    try {
        const fkontak = createFakeContact(message);

        const senderJid = (message.key.participant || message.key.remoteJid || '').replace(/:\d+/, '');
        const senderPhone = senderJid.split('@')[0];

        const res = await fetch('https://api.github.com/repos/Teddytech1/TEDDY-XMD');
        if (!res.ok) throw new Error('Error fetching repository data');
        const json = await res.json();

        const botName = settings.botName || global.botname || "TEDDY-XMD";
        const ownerName = settings.ownerName || "Teddy Tech";

        let txt = `🔸 *${botName} REPO INFO* 🔸\n\n`;
        txt += `📦 *Name:* ${json.name}\n`;
        txt += `👑 *Owner:* ${json.owner.login}\n`;
        txt += `⭐ *Stars:* ${json.stargazers_count}\n`;
        txt += `🍴 *Forks:* ${json.forks_count}\n`;
        txt += `👀 *Watchers:* ${json.watchers_count}\n`;
        txt += `💾 *Size:* ${(json.size / 1024).toFixed(2)} MB\n`;
        txt += `💻 *Language:* ${json.language || 'JavaScript'}\n`;
        txt += `🕐 *Updated:* ${moment(json.updated_at).format('DD/MM/YY HH:mm')}\n\n`;
        txt += `📝 *Desc:* ${json.description || 'TEDDY-XMD WhatsApp Bot'}\n\n`;
        txt += `Hey @${senderPhone} 👋\n`;
        txt += `Thanks for choosing *${botName}*!\n`;
        txt += `Don't forget to *Star* ⭐ and *Fork* 🍴`;

        const imgPath = path.resolve(__dirname, "../assets/menu1.jpg");

        const buttons = [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "⭐ Star Repo",
                    url: json.html_url,
                    merchant_url: json.html_url
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "🍴 Fork Repo",
                    url: `${json.html_url}/fork`,
                    merchant_url: `${json.html_url}/fork`
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "📢 WhatsApp Channel",
                    url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n",
                    merchant_url: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n"
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "💬 Telegram Channel",
                    url: "https://t.me/teddy-xmd",
                    merchant_url: "https://t.me/free_net_zone1"
                })
            }
        ];

        const buttonMessage = {
            text: txt,
            footer: `> ρσωєяє∂ ву ${ownerName}`,
            buttons: buttons,
            headerType: 1,
            viewOnce: true,
            mentions: [senderJid],
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421104812135@newsletter',
                    newsletterName: 'TEDDY-XMD Official',
                    serverMessageId: -1
                }
            }
        };

        if (fs.existsSync(imgPath)) {
            buttonMessage.image = fs.readFileSync(imgPath);
            buttonMessage.headerType = 4;
        }

        await sock.sendMessage(chatId, buttonMessage, { quoted: fkontak });

        await sock.sendMessage(chatId, {
            react: { text: '⭐', key: message.key }
        });

    } catch (error) {
        console.error("Error in github command:", error);

        // Fallback without buttons if they fail
        const fallbackText = `❌ *Error loading repo info*\n\n` +
            `*Repo:* https://github.com/Teddytech1/TEDDY-XMD\n` +
            `*Channel:* https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n`;

        await sock.sendMessage(chatId, {
            text: fallbackText
        }, { quoted: createFakeContact(message) });
    }
}

module.exports = githubCommand;
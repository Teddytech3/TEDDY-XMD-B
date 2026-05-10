const { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

async function setGroupStatusCommand(sock, chatId, msg) {
    try {
        // Owner check
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ Only the owner can use this command!' });
            return;
        }

        // Must be used inside a group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Use this command inside the group you want to post to.' });
            return;
        }

        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const commandRegex = /^[.!#/]?(togstatus|swgc|groupstatus)\s*/i;

        const fullText = messageText.replace(commandRegex, '').trim();

        // Parse caption after "|"
        let caption = '';
        if (fullText.includes('|')) {
            const parts = fullText.split('|');
            parts.shift();
            caption = parts.join('|').trim();
        } else if (fullText) {
            caption = fullText;
        }
        caption = caption.replace(commandRegex, '').trim();

        let payload = {};

        // Handle quoted media
        if (quotedMessage) {
            if (quotedMessage.imageMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                payload = { image: buffer, caption: caption || '' };
            } else if (quotedMessage.videoMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                payload = { video: buffer, caption: caption || '' };
            } else if (quotedMessage.audioMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.audioMessage, 'audio');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                const audioVn = await toVN(buffer);
                payload = { audio: audioVn, mimetype: "audio/ogg; codecs=opus", ptt: true };
            } else if (quotedMessage.stickerMessage) {
                const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                payload = { sticker: buffer };
            } else {
                payload = { text: caption || '' };
            }
        } else {
            payload = { text: caption || '' };
        }

        if (!payload.text &&!payload.image &&!payload.video &&!payload.audio &&!payload.sticker) {
            await sock.sendMessage(chatId, { text: '❌ Nothing to post. Reply to a message or add text.' });
            return;
        }

        // Send to group status
        await sendGroupStatus(sock, chatId, payload);

        const mediaType = quotedMessage
           ? (quotedMessage.imageMessage? 'Image'
              : quotedMessage.videoMessage? 'Video'
              : quotedMessage.audioMessage? 'Audio'
              : quotedMessage.stickerMessage? 'Sticker'
              : 'Text')
            : 'Text';

        await sock.sendMessage(chatId, { text: `✅ ${mediaType} posted to group status!` + (caption? `\nCaption: "${caption}"` : '') });

    } catch (error) {
        console.error('Error in togstatus command:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` });
    }
}

async function sendGroupStatus(conn, groupJid, content) {
    const inside = await generateWAMessageContent(content, { upload: conn.waUploadToServer });
    const messageSecret = crypto.randomBytes(32);

    const m = generateWAMessageFromContent('status@broadcast', {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: {
            message: {...inside, messageContextInfo: { messageSecret } },
            key: { participant: groupJid }
        }
    }, {});

    await conn.relayMessage('status@broadcast', m.message, {
        messageId: m.key.id,
        statusJidList: [groupJid] // Target the group
    });
    return m;
}

// Convert audio to voice note
async function toVN(inputBuffer) {
    return new Promise((resolve, reject) => {
        const inStream = new PassThrough();
        inStream.end(inputBuffer);
        const outStream = new PassThrough();
        const chunks = [];

        ffmpeg(inStream)
           .noVideo()
           .audioCodec("libopus")
           .format("ogg")
           .audioBitrate("48k")
           .audioChannels(1)
           .audioFrequency(48000)
           .on("error", reject)
           .on("end", () => resolve(Buffer.concat(chunks)))
           .pipe(outStream, { end: true });

        outStream.on("data", chunk => chunks.push(chunk));
    });
}

module.exports = setGroupStatusCommand;

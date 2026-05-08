function createFakeContact(message) {
    const { getBotName } = require('./botConfig');
    const botName = getBotName() || 'TEDDY-XMD';
    const ownerNumber = '254799963583'; // Your number

    return {
        key: {
            participants: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast',
            fromMe: false,
            id: 'TEDDY-XMD'
        },
        message: {
            contactMessage: {
                displayName: `${botName} Verified`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;;;Bot;;;\nFN:${botName} Official\nORG:Teddy Tech;\nTITLE:WhatsApp Bot\nitem1.TEL;waid=${ownerNumber}:${ownerNumber}\nitem1.X-ABLabel:Owner\nitem2.URL:https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n\nitem2.X-ABLabel:Channel\nX-WA-BIZ-DESCRIPTION:TEDDY-XMD | Supreme Edition\nX-WA-BIZ-NAME:${botName}\nEND:VCARD`
            }
        },
        participant: '0@s.whatsapp.net'
    };
}

module.exports = { createFakeContact };
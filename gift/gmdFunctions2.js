const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const config = require("../config");
const { createContext } = require("./gmdHelpers");
const logger = require("gifted-baileys/lib/Utils/logger").default.child({});
const { isJidGroup, downloadMediaMessage, getContentType } = require("gifted-baileys");

const {
    CHATBOT: chatBot,
    ANTICALL: antiCall,
    ANTICALL_MSG: antiCallMsg,
    DM_PRESENCE: dmPresence,
    GC_PRESENCE: groupPresence,
    MODE: botMode, 
    FOOTER: botFooter,
    BOT_NAME: botName,
    BOT_PIC: botPic, 
    TIME_ZONE: tZ,
    ANTIDELETE: antiDelete,
} = config;

// Branded Identifiers
const GURU_NAME = "GuruTech";
const NI_MBAYA = " `NI MBAYA 😅` ";

const formatTime = (timestamp) => {
    const timeZone = tZ || 'Africa/Nairobi'; 
    const date = new Date(timestamp);
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone };
    return new Intl.DateTimeFormat('en-US', options).format(date);
};

const formatDate = (timestamp) => {
    const timeZone = tZ || 'Africa/Nairobi';
    const date = new Date(timestamp);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone };
    return new Intl.DateTimeFormat('en-GB', options).format(date); 
};

const isMediaMessage = message => {
    const typeOfMessage = getContentType(message);
    const mediaTypes = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'documentMessage',
        'stickerMessage'
    ];
    return mediaTypes.includes(typeOfMessage);
};

const isAnyLink = (message) => {
    const linkPattern = /https?:\/\/[^\s]+/;
    return linkPattern.test(message);
};

const emojis = ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍', '🔥', '❤️‍', '🩹', '💯', '♨️', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🌐', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🎭️', '🔇', '🔈️', '🔉', '🔊', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '🏧', '🚮', '🚰', '♿️', '🚹️', '🚺️', '🚻', '🚼️', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭️', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩️', '⏭️', '⏯️', '◀️', '⏪️', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓️', '❔', '❕', '❗️', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕️', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯️', '🉐', '🈹', '🈚️', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫️', '⚪️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '◼️', '◻️', '◾️', '◽️', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🕛️', '🕧️', '🕐️', '🕜️', '🕑️', '🕝️', '🕒️', '🕞️', '🕓️', '🕟️', '🕔️', '🕠️', '🕕️', '🕡️', '🕖️', '🕢️', '🕗️', '🕣️', '🕘️', '🕤️', '🕙️', '🕥️', '🕚️', '🕦️', '*️', '#️', '0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️', '🛎️', '🧳', '⌛️', '⏳️', '⌚️', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '🗺️', '🧭', '🎃', '🎄', '🧨', '🎈', '🎉', '🎊', '🎎', '🎏', '🎐', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🔮', '🧿', '🎮️', '🕹️', '🎰', '🎲', '♟️', '🧩', '🧸', '🖼️', '🎨', '🧵', '🧶', '👓️', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓️', '🧢', '⛑️', '📿', '💄', '💍', '💎', '📢', '📣', '📯', '🎙️', '🎚️', '🎛️', '🎤', '🎧️', '📻️', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '📱', '📲', '☎️', '📞', '📟️', '📠', '🔋', '🔌', '💻️', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿️', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬️', '📺️', '📷️', '📸', '📹️', '📼', '🔍️', '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚️', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰️', '💴', '💵', '💶', '💷', '💸', '💳️', '🧾', '✉️', '💌', '📧', '🧧', '📨', '📩', '📤️', '📥️', '📦️', '📫️', '📪️', '📬️', '📭️', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋️', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒️', '🔓️', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣️', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🏺', '🕳️', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠️', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭️', '🏯', '🏰', '💒', '🗼', '🗽', '⛪️', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲️', '⛺️', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🗾', '🏞️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇️', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍️', '🚎', '🚐', '🚑️', '🚒', '🚓', '🚔️', '🚕', '🚖', '🚗', '🚘️', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲️', '🛴', '🛹', '🚏', '🛣️', '🛤️', '🛢️', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🎆', '🎇', '🎑', '🗿', '⚽️', '⚾️', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🎖️', '🏆️', '🏅', '🥇', '🥈', '🥉', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🍵', '🍶', '🍾', '🍷', '🍸️', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🐵', '🐒', '🦍', '🦧', '🐶', '🐕️', '🦮', '🐕‍', '🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈️', '🐈‍', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐻‍', '❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦️', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟️', '🐠', '🐡', '🦈', '🐙', '🦑', '🦀', '🦞', '🦐', '🦪', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '蠍', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🎋', '🎍', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍️', '🌎️', '🌏️', '🌑', '🌒', '🌓', '🌔', '🌕️', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜️', '☀️', '🌝', '🌞', '🪐', '💫', '⭐️', '🌟', '✨', '🌠', '🌌', '☁️', '⛅️', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔️', '⛱️', '⚡️', '❄️', '☃️', '⛄️', '☄️', '🔥', '💧', '🌊', '💥', '💦', '💨', '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐️', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '😮‍', '💨', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍', '🌫️', '🥴', '😵‍', '💫', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽️', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈️', '👉️', '👆️', '🖕', '👇️', '☝️', '👍️', '👎️', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂️', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '🧔‍♀️', '🧔‍♂️', '🧑', '👨‍', '🦰', '👩‍', '🦰', '🧑', '👨‍', '🦱', '👩‍', '🦱', '🧑', '👨‍', '🦳', '👩‍', '🦳', '🧑', '👨‍', '🦲', '👩‍', '🦲', '👱', '👱‍♂️', '👱‍♀️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱', '👩‍', '🍼', '👨‍', '🍼', '🧑‍', '🍼', '👼', '🎅', '🤶', '🧑‍', '🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍', '🦯', '👨‍', '🦯', '👩‍', '🦯', '🧑‍', '🦼', '👨‍', '🦼', '👩‍', '🦼', '🧑‍', '🦽', '👨‍', '🦽', '👩‍', '🦽', '跑', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂️', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄️', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊️', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍', '🤝‍', '🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👪️', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '👣']; 

const GiftedApiKey = '_0u5aff45,_0l1876s8qc'; 
const GiftedTechApi = 'https://api.giftedtech.co.ke';

async function GiftedAutoReact(emoji, ms, Gifted) {
  try {
    const react = {
      react: {
        text: emoji,
        key: ms.key,
      },
    };
    await Gifted.sendMessage(ms.key.remoteJid, react);
  } catch (error) {
    console.error('Error sending auto reaction:', error);
  }
}

const GiftedAntiLink = async (Gifted, message, antiLink) => {
    try {
        if (!message?.message || message.key.fromMe) return;
        const from = message.key.remoteJid; 
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup || antiLink === 'false') return;

        const groupMetadata = await Gifted.groupMetadata(from);
        const groupAdmins = groupMetadata.participants
            .filter((member) => member.admin)
            .map((admin) => admin.id);

        if (groupAdmins.includes(sender)) return;

        const messageType = getContentType(message.message);
        const body = messageType === 'conversation'
            ? message.message.conversation
            : message.message[messageType]?.text || message.message[messageType]?.caption || '';

        if (!body || !isAnyLink(body)) return;

        await Gifted.sendMessage(from, { delete: message.key });

        const userTag = `@${sender.split('@')[0]}`;
        const header = `*══✪ [ ANTILINK ] ✪══*\n\n`;
        const footerBranding = `\n👤 *Dev:* ${GURU_NAME}\n> ${NI_MBAYA}`;

        if (antiLink === 'kick') {
            await Gifted.groupParticipantsUpdate(from, [sender], 'remove');
            await Gifted.sendMessage(from, {
                    text: `${header}⚠️ ${botName} anti-link active!\nUser ${userTag} has been kicked for sharing a link.${footerBranding}`,
                    mentions: [sender],
                }
            );
        } else if (antiLink === 'delete') {
            await Gifted.sendMessage(from, {
                    text: `${header}⚠️ ${botName} anti-link active!\nLinks are not allowed here ${userTag}!${footerBranding}`,
                    mentions: [sender],
                }
            );
        } else if (antiLink === 'warn') {
            await Gifted.sendMessage(from, {
                    text: `${header}⚠️ Warning ${userTag}!\nLinks are not allowed in this group!${footerBranding}`,
                    mentions: [sender],
                }
            );
        }
    } catch (err) {
        console.error('Anti-link error:', err);
    }
};

function getTimeBlock() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 16) return "afternoon";
    if (hour >= 16 && hour < 21) return "evening";
    if (hour >= 21 || hour < 2) return "night";
    return "latenight";
}

const quotes = {
    morning: [ "☀️ ʀɪsᴇ ᴀɴᴅ sʜɪɴᴇ. ɢʀᴇᴀᴛ ᴛʜɪɴɢs ɴᴇᴠᴇʀ ᴄᴀᴍᴇ ғʀᴏᴍ ᴄᴏᴍғᴏʀᴛ ᴢᴏɴᴇs.", "🌅 ᴇᴀᴄʜ ᴍᴏʀɴɪɴɢ ᴡᴇ ᴀʀᴇ ʙᴏʀɴ ᴀɢᴀɪɴ. ᴡʜᴀᴛ ᴡᴇ ᴅᴏ ᴛᴏᴅᴀʏ ɪs ᴡʜᴀᴛ ᴍᴀᴛᴛᴇʀs ᴍᴏsᴛ." ], 
    afternoon: [ "⏳ ᴋᴇᴇᴘ ɢᴏɪɴɢ. ʏᴏᴜ'ʀᴇ ʜᴀʟғᴡᴀʏ ᴛᴏ ɢʀᴇᴀᴛɴᴇss.", "🔄 sᴛᴀʏ ғᴏᴄᴜsᴇᴅ. ᴛʜᴇ ɢʀɪɴᴅ ᴅᴏᴇsɴ'ᴛ sᴛᴏᴘ ᴀᴛ ɴᴏᴏɴ." ],
    evening: [ "🛌 ʀᴇsᴛ ɪs ᴘᴀʀᴛ ᴏғ ᴛʜᴇ ᴘʀᴏᴄᴇss. ʀᴇᴄʜᴀʀɢᴇ ᴡɪsᴇʟʏ.", "🌇 ᴇᴠᴇɴɪɴɢ ʙʀɪɴɢꜱ ꜱɪʟᴇɴᴄᴇ ᴛʜᴀᴛ ꜱᴘᴇᴀᴋꜱ ʟᴏᴜᴅᴇʀ ᴛʜᴀɴ ᴅᴀʏʟɪɢʜᴛ." ],
    night: [ "🌌 ᴛʜᴇ ɴɪɢʜᴛ ɪs sɪʟᴇɴᴛ, ʙᴜᴛ ʏᴏᴜʀ ᴅʀᴇᴀᴍs ᴀʀᴇ ʟᴏᴜᴅ.", "⭐ sᴛᴀʀs sʜɪɴᴇ ʙʀɪɢʜᴛᴇsᴛ ɪɴ ᴛʜᴇ ᴅᴀʀᴋ. sᴏ ᴄᴀɴ ʏᴏᴜ." ],
    latenight: [ "🕶️ ᴡʜɪʟᴇ ᴛʜᴇ ᴡᴏʀʟᴅ sʟᴇᴇᴘs, ᴛʜᴇ ᴍɪɴᴅs ᴏғ ʟᴇɢᴇɴᴅs ᴡᴀɴᴅᴇʀ.", "⏱️ ʟᴀᴛᴇ ɴɪɢʜᴛs ᴛᴇᴀᴄʜ ᴛʜᴇ ᴅᴇᴇᴘᴇsᴛ ʟᴇssᴏɴs." ] 
};

function getCurrentDateTime() {
    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    }).format(new Date());
}

const GiftedAutoBio = async (Gifted) => {
    try {
        const block = getTimeBlock();
        const timeDate = getCurrentDateTime();
        const timeQuotes = quotes[block];
        const quote = timeQuotes[Math.floor(Math.random() * timeQuotes.length)];
        const bioText = `${botName} Online | Dev: ${GURU_NAME} ⚡\n📅 ${timeDate}\n➤ ${quote}\n${NI_MBAYA}`;
        await Gifted.updateProfileStatus(bioText);
    } catch (error) {
        console.error("Bio Update Error:", error);
    }
};

const availableApis = [
    `${GiftedTechApi}/api/ai/ai?apikey=${GiftedApiKey}&q=`,
    `${GiftedTechApi}/api/ai/mistral?apikey=${GiftedApiKey}&q=`,
    `${GiftedTechApi}/api/ai/meta-llama?apikey=${GiftedApiKey}&q=`
];

function getRandomApi() {
    return availableApis[Math.floor(Math.random() * availableApis.length)];
}

function processForTTS(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[\[\]\(\)\{\}]/g, ' ')
              .replace(/\s+/g, ' ')
              .substring(0, 190);
}

const identityPatterns = [
    /who\s*(made|created|built)\s*you/i,
    /who\s*is\s*your\s*(creator|developer|maker|owner|father|parent)/i,
    /what('?s| is)\s*your\s*name\??/i,
    /who\s*are\s*you\??/i,
    /are\s*you\s*gifted/i
];

function isIdentityQuestion(query) {
    return identityPatterns.some(pattern => typeof query === 'string' && pattern.test(query));
}

async function getAIResponse(query) {
    if (isIdentityQuestion(query)) {
        return `I am ${botName}, an Interactive Ai Assistant Chat Bot developed by *${GURU_NAME}*! \n\n ${NI_MBAYA}`;
    }
    
    try {
        const apiUrl = getRandomApi();
        const response = await fetch(apiUrl + encodeURIComponent(query));
        const data = await response.json();
        return data.result || data.response || "Sorry, I am busy right now.";
    } catch (error) {
        return "I couldn't reach my brain. Try again!";
    }
}

function GiftedChatBot(Gifted, chatBot, chatBotMode, createContext, createContext2, googleTTS) {
    if (chatBot === 'true' || chatBot === 'audio') {
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg?.message || msg.key.fromMe) return;
                const jid = msg.key.remoteJid;
                const isGroup = jid.endsWith('@g.us');
                if (chatBotMode === 'groups' && !isGroup) return;
                if (chatBotMode === 'inbox' && isGroup) return;
                
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption;
                if (!text || typeof text !== 'string') return;

                const aiResponse = await getAIResponse(text);

                if (chatBot === "true") {
                    await Gifted.sendMessage(jid, { 
                        text: `*══✪ [ ${botName.toUpperCase()} AI ] ✪══*\n\n${aiResponse}\n\n👤 *Dev:* ${GURU_NAME}\n> ${NI_MBAYA}`,
                    }, { quoted: msg });
                }

                if (chatBot === 'audio' && aiResponse) {
                    const ttsText = processForTTS(String(aiResponse));
                    const audioUrl = googleTTS.getAudioUrl(ttsText, { lang: "en", slow: false, host: "https://translate.google.com" });
                    await Gifted.sendMessage(jid, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        ptt: true,
                        waveform: [1000, 0, 1000, 0, 1000, 0, 1000],
                        ...createContext2(jid, { title: `${botName} AUDIO`, body: `Dev: ${GURU_NAME}` })
                    }, { quoted: msg });
                }
            } catch (error) { console.error(error); }
        });
    }
}

const presenceTimers = new Map();

const GiftedPresence = async (Gifted, jid) => {
    try {
        const isGroup = jid.endsWith('@g.us');
        if (presenceTimers.has(jid)) { clearTimeout(presenceTimers.get(jid)); presenceTimers.delete(jid); }
        const presenceType = isGroup ? groupPresence : dmPresence;
        if (!presenceType) return;
        const statusMap = { 'online': 'available', 'typing': 'composing', 'recording': 'recording', 'offline': 'unavailable' };
        await Gifted.sendPresenceUpdate(statusMap[presenceType.toLowerCase()] || 'available', jid);
        presenceTimers.set(jid, setTimeout(() => presenceTimers.delete(jid), 15 * 60 * 1000));
    } catch (e) { logger.error(e.message); }
};

const GiftedAnticall = async (json, Gifted) => {
   for (const id of json) {
      if (id.status === 'offer') {
         const alert = `*🚫 CALL REJECTED*\n\n@${id.from.split('@')[0]}, Calls are not allowed on this bot.\n\n👤 *Dev:* ${GURU_NAME}\n> ${NI_MBAYA}`;
         await Gifted.sendMessage(id.from, { text: alert, mentions: [id.from] });
         await Gifted.rejectCall(id.id, id.from);
         if (antiCall === "block") await Gifted.updateBlockStatus(id.from, "block");
      }
   }
};

const processMediaMessage = async (deletedMessage) => {
    const type = getContentType(deletedMessage.message);
    if (!type) return null;
    try {
        const stream = await downloadMediaMessage(deletedMessage, 'stream', { }, { logger });
        let buffer = Buffer.from([]);
        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
        const ext = type.replace('Message', '').replace('sticker', 'webp').replace('image', 'jpg').replace('video', 'mp4').replace('audio', 'mp3');
        const tempPath = path.join(__dirname, `../temp/del_${Date.now()}.${ext}`);
        await fs.ensureDir(path.dirname(tempPath));
        await fs.writeFile(tempPath, buffer);
        return { path: tempPath, type: type.replace('Message', ''), caption: deletedMessage.message[type]?.caption || '' };
    } catch (e) { return null; }
};

const GiftedAntiDelete = async (Gifted, deletedMsg, key, deleter, sender, botOwnerJid, deleterPushName, senderPushName) => {
    const currentTime = formatTime(Date.now());
    const target = antiDelete === 'inchat' ? key.remoteJid : botOwnerJid;
    const senderTag = `@${sender.split('@')[0]}`;
    const deleterTag = `@${deleter.split('@')[0]}`;

    const header = `*𝙰𝙽𝚃𝙸-𝙳𝙴𝙻𝙴𝚃𝙴 𝚂𝚈𝚂𝚃𝙴𝙼 𝙱𝚈 ${GURU_NAME.toUpperCase()}*\n\n` +
                   `👤 *Author:* ${senderTag}\n` +
                   `🚫 *Deleted By:* ${deleterTag}\n` +
                   `🕒 *Time:* ${currentTime}\n` +
                   `> ${NI_MBAYA}\n\n`;

    if (deletedMsg.message?.conversation || deletedMsg.message?.extendedTextMessage?.text) {
        const text = deletedMsg.message.conversation || deletedMsg.message.extendedTextMessage.text;
        await Gifted.sendMessage(target, { text: header + "*Content:* " + text, mentions: [sender, deleter] });
    } else {
        const media = await processMediaMessage(deletedMsg);
        if (media) {
            await Gifted.sendMessage(target, {
                [media.type]: { url: media.path },
                caption: header + (media.caption ? `*Caption:* ${media.caption}` : ""),
                mentions: [sender, deleter]
            });
            setTimeout(() => fs.unlink(media.path).catch(e => {}), 60000);
        }
    }
};

module.exports = { logger, emojis, GiftedAutoReact, GiftedTechApi, GiftedApiKey, GiftedAntiLink, GiftedAutoBio, GiftedChatBot, GiftedAntiDelete, GiftedAnticall, GiftedPresence };

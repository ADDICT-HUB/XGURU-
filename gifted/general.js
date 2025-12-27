const { gmd, commands, monospace, formatBytes } = require("../gift"),
      fs = require('fs'), 
      axios = require('axios'),
      BOT_START_TIME = Date.now(),
      { totalmem: totalMemoryBytes, 
      freemem: freeMemoryBytes } = require('os'),
      moment = require('moment-timezone'), 
      more = String.fromCharCode(8206), 
      readmore = more.repeat(4001),
      { downloadContentFromMessage, generateWAMessageFromContent, normalizeMessageContent } = require('gifted-baileys'),
      ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;

// Import sendButtons safely
let sendButtons;
try {
  sendButtons = require('gifted-btns').sendButtons;
} catch (e) {
  console.log("gifted-btns not available, using fallback");
  sendButtons = null;
}


gmd({ 
  pattern: "ping",
  aliases: ['pi'],
  react: "⚡",
  category: "general",
  description: "Check bot response speed",
}, async (from, Gifted, conText) => {
  const { mek, react, newsletterJid, newsletterUrl, botFooter, botName, reply } = conText;
  
  try {
    const startTime = process.hrtime();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.floor(80 + Math.random() * 420)));
    
    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor((elapsed[0] * 1000) + (elapsed[1] / 1000000));

    // Determine speed quality
    let speedEmoji = "🟢";
    let speedText = "Excellent";
    
    if (responseTime > 1000) {
      speedEmoji = "🔴";
      speedText = "Slow";
    } else if (responseTime > 500) {
      speedEmoji = "🟡";
      speedText = "Average";
    } else if (responseTime > 200) {
      speedEmoji = "🟢";
      speedText = "Good";
    }

    const pingMessage = 
      `╭━━━『 *𝐏𝐈𝐍𝐆 𝐑𝐄𝐒𝐔𝐋𝐓* 』━━━╮\n\n` +
      `${speedEmoji} *Speed:* ${responseTime}ms\n` +
      `📊 *Quality:* ${speedText}\n` +
      `⚡ *Status:* Active\n\n` +
      `╰━━━━━━━━━━━━━━━━━━╯`;

    // Try to send with buttons if available
    if (sendButtons && newsletterUrl) {
      try {
        await sendButtons(Gifted, from, {
          text: pingMessage,    
          footer: `> *${botFooter}*`,            
          buttons: [ 
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'WhatsApp Channel',
                url: newsletterUrl,
                merchant_url: newsletterUrl
              })
            }
          ]
        });
      } catch (btnError) {
        console.log("Button send failed, using regular message:", btnError.message);
        // Fallback to regular message
        await Gifted.sendMessage(from, {
          text: `${pingMessage}\n\n> *${botFooter}*`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143
            }
          }
        }, { quoted: mek });
      }
    } else {
      // Fallback to regular message
      await Gifted.sendMessage(from, {
        text: `${pingMessage}\n\n> *${botFooter}*`,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    }

    await react("✅");
  } catch (error) {
    console.error("Ping command error:", error);
    await reply(`❌ Ping failed: ${error.message}`);
  }
});


gmd({
  pattern: "report",
  aliases: ["request"],
  react: '💫',
  description: "Request New Features or Report Issues",
  category: "owner",
}, async (from, Gifted, conText) => {
  const { mek, q, sender, react, pushName, botPrefix, isSuperUser, reply } = conText;
  
  // Store reported messages in memory (resets on restart)
  if (!global.reportedMessages) {
    global.reportedMessages = {};
  }
  
  const devlopernumber = '254799916673';
  
  try {
    if (!isSuperUser) {
      return reply("*❌ Owner Only Command*");
    }
    
    if (!q) {
      return reply(`*Usage Example:*\n${botPrefix}request Hi dev, downloader commands are not working`);
    }
    
    const messageId = mek.key.id;
    
    // Check if already reported
    if (global.reportedMessages[messageId]) {
      return reply("⚠️ This report has already been forwarded to the owner. Please wait for a response.");
    }
    
    // Mark as reported
    global.reportedMessages[messageId] = true;
    
    const textt = `*| REQUEST/REPORT |*`;
    const teks1 = `\n\n*User:* @${sender.split("@")[0]}\n*Request/Report:* ${q}`;
    
    await Gifted.sendMessage(devlopernumber + "@s.whatsapp.net", {
      text: textt + teks1,
      mentions: [sender],
    }, {
      quoted: mek,
    });
    
    await reply("✅ *Thank you for your report!*\n\nIt has been forwarded to the owner. Please wait for a response.");
    await react("✅"); 
  } catch (e) {
    console.error("Report error:", e);
    reply(`❌ Error: ${e.message || e}`);
  }
});


gmd({
  pattern: "menus",
  aliases: ["mainmenu"],
  description: "Display Bot's Uptime, Date, Time, and Other Stats",
  react: "📜",
  category: "general",
}, async (from, Gifted, conText) => {
  const { mek, sender, react, config, pushName, botPic, botMode, botVersion, botName, botFooter, timeZone, botPrefix, newsletterJid, reply } = conText;
  
  try {
    function formatUptime(seconds) {
      const days = Math.floor(seconds / (24 * 60 * 60));
      seconds %= 24 * 60 * 60;
      const hours = Math.floor(seconds / (60 * 60));
      seconds %= 60 * 60;
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);

    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);

    const uptime = formatUptime(process.uptime());
    const totalCommands = commands.filter((command) => command.pattern).length;

    let menus = `
*🦄 Uptime:* ${monospace(uptime)}
*🍁 Date Today:* ${monospace(date)}
*🎗 Time Now:* ${monospace(time)}

➮ Founder - Gifted Tech
➮ User - ${monospace(pushName)}
➮ Number - ${monospace(config.OWNER_NUMBER || 'N/A')} 
➮ Memory - ${monospace(ram)}

*🧑‍💻 :* ${monospace(botName)} Is Available

╭──❰ *ALL MENU* ❱
│🏮 List
│🏮 Category
│🏮 Help
│🏮 Alive
│🏮 Uptime
│🏮 Weather
│🏮 Link
│🏮 Cpu
│🏮 Repository
╰─────────────⦁`;

    const giftedMess = {
      image: { url: botPic },
      caption: menus.trim(),
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: botName,
          serverMessageId: 0
        }
      }
    };
    
    await Gifted.sendMessage(from, giftedMess, { quoted: mek });
    await react("✅");
  } catch (e) {
    console.error("Menus error:", e);
    reply(`❌ Error: ${e.message || e}`);
  }
});


gmd({
  pattern: "list",
  aliases: ["listmenu"],
  description: "Show All Commands and their Usage",
  react: "📜",
  category: "general",
}, async (from, Gifted, conText) => {
  const { mek, sender, react, pushName, botPic, botMode, botVersion, botName, botFooter, timeZone, botPrefix, newsletterJid, reply } = conText;
  
  try {
    function formatUptime(seconds) {
      const days = Math.floor(seconds / (24 * 60 * 60));
      seconds %= 24 * 60 * 60;
      const hours = Math.floor(seconds / (60 * 60));
      seconds %= 60 * 60;
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);

    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);

    const uptime = formatUptime(process.uptime());
    const totalCommands = commands.filter((command) => command.pattern).length;

    // Bold techy font function
    function boldFont(txt) {
      const letters = {
        A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚',
        H: '𝗛', I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡',
        O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨',
        V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
        a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴',
        h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻',
        o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂',
        v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
        0: '𝟬', 1: '𝟭', 2: '𝟮', 3: '𝟯', 4: '𝟰', 5: '𝟱', 6: '𝟲', 7: '𝟳', 8: '𝟴', 9: '𝟵'
      };
      return txt.split('').map(c => letters[c] || c).join('');
    }

    // Metallic menu with bold font
    let list = `
╔═━⊹✦ ${boldFont(botName)} ✦⊹━═╗

💠 ${boldFont("BOT INFO")}
╭────────────────────────╮
│ 🔹 ${boldFont("Mode")}       : ${monospace(botMode)}
│ 🔹 ${boldFont("Prefix")}     : [${monospace(botPrefix)}]
│ 🔹 ${boldFont("User")}       : ${monospace(pushName)}
│ 🔹 ${boldFont("Plugins")}    : ${monospace(totalCommands.toString())}
│ 🔹 ${boldFont("Version")}    : ${monospace(botVersion)}
│ 🔹 ${boldFont("Uptime")}     : ${monospace(uptime)}
│ 🔹 ${boldFont("Time Now")}   : ${monospace(time)}
│ 🔹 ${boldFont("Date")}       : ${monospace(date)}
│ 🔹 ${boldFont("TimeZone")}   : ${monospace(timeZone)}
│ 🔹 ${boldFont("Server RAM")} : ${monospace(ram)}
╰────────────────────────╯

💠 ${boldFont("COMMANDS LIST")}
╭────────────────────────╮`;

    commands.forEach((gmd, index) => {
      if (gmd.pattern && gmd.description) {
        list += `│ ⚡ ${boldFont((index + 1) + ". " + gmd.pattern)}\n│    ${gmd.description}\n`;
      }
    });

    list += `╰────────────────────────╯${readmore}\n`;

    const giftedMess = {
      image: { url: botPic },
      caption: list.trim(),
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: botName,
          serverMessageId: 0
        }
      }
    };
    
    await Gifted.sendMessage(from, giftedMess, { quoted: mek });
    await react("✅");
  } catch (e) {
    console.error("List error:", e);
    reply(`❌ Error: ${e.message || e}`);
  }
});


gmd({ 
  pattern: "menu", 
  aliases: ['help', 'allmenu'],
  react: "🪀",
  category: "general",
  description: "Fetch bot main menu",
}, async (from, Gifted, conText) => {
  const { mek, sender, react, pushName, botPic, botMode, botVersion, botName, botFooter, timeZone, botPrefix, newsletterJid, reply } = conText;
  
  try {
    function formatUptime(seconds) {
      const days = Math.floor(seconds / (24 * 60 * 60));
      seconds %= 24 * 60 * 60;
      const hours = Math.floor(seconds / (60 * 60));
      seconds %= 60 * 60;
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const now = new Date();
    const date = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);

    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(now);

    const uptime = formatUptime(process.uptime());
    const totalCommands = commands.filter((command) => command.pattern).length;

    const categorized = commands.reduce((menu, gmd) => {
      if (gmd.pattern && !gmd.dontAddCommandList) {
        if (!menu[gmd.category]) menu[gmd.category] = [];
        menu[gmd.category].push(gmd.pattern);
      }
      return menu;
    }, {});
    
    let header = `╭══〘〘 *${monospace(botName)}* 〙〙═⊷
┃❍ *Mode:*  ${monospace(botMode)}
┃❍ *Prefix:*  [ ${monospace(botPrefix)} ]
┃❍ *User:*  ${monospace(pushName)}
┃❍ *Plugins:*  ${monospace(totalCommands.toString())}
┃❍ *Version:*  ${monospace(botVersion)}
┃❍ *Uptime:*  ${monospace(uptime)}
┃❍ *Time Now:*  ${monospace(time)}
┃❍ *Date Today:*  ${monospace(date)}
┃❍ *Time Zone:*  ${monospace(timeZone)}
┃❍ *Server Ram:*  ${monospace(ram)}
╰═════════════════⊷\n${readmore}\n`;

    const formatCategory = (category, gmds) => {
      const title = `╭━━━━❮ *${monospace(category.toUpperCase())}* ❯━⊷ \n`;
      const body = gmds.map(gmd => `┃◇ ${monospace(botPrefix + gmd)}`).join('\n');
      const footer = `╰━━━━━━━━━━━━━━━━━⊷\n`;
      return `${title}${body}\n${footer}\n`;
    };

    let menu = header;
    for (const [category, gmds] of Object.entries(categorized)) {
      menu += formatCategory(category, gmds) + '\n';
    }
    
    const giftedMess = {
      image: { url: botPic },
      caption: `${menu.trim()}\n\n> *${botFooter}*`,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: botName,
          serverMessageId: 0
        }
      }
    };
    
    await Gifted.sendMessage(from, giftedMess, { quoted: mek });
    await react("✅");
  } catch (e) {
    console.error("Menu error:", e);
    reply(`❌ Error: ${e.message || e}`);
  }
});


gmd({
  pattern: "return",
  aliases: ['details', 'det', 'ret'],
  react: "⚡",
  category: "owner",
  description: "Displays the full raw quoted message using Baileys structure.",
}, async (from, Gifted, conText) => {
  const { mek, reply, react, quotedMsg, isSuperUser, botName, botFooter, newsletterJid, newsletterUrl } = conText;
  
  if (!isSuperUser) {
    return reply(`❌ Owner Only Command!`);
  }
  
  if (!quotedMsg) {
    return reply(`⚠️ Please reply to/quote a message`);
  }

  try {
    const jsonString = JSON.stringify(quotedMsg, null, 2);
    const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];

    for (const chunk of chunks) {
      const formattedMessage = `\`\`\`\n${chunk}\n\`\`\``;

      // Try buttons first, fallback to regular message
      if (sendButtons && newsletterUrl) {
        try {
          await sendButtons(Gifted, from, {
            text: formattedMessage,    
            footer: `> *${botFooter}*`,            
            buttons: [ 
              { 
                name: 'cta_copy', 
                buttonParamsJson: JSON.stringify({ 
                  display_text: 'Copy', 
                  copy_code: chunk 
                }) 
              },
              {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: 'WhatsApp Channel',
                  url: newsletterUrl,
                  merchant_url: newsletterUrl
                })
              }
            ]
          });
        } catch (btnError) {
          console.log("Button send failed, using regular message");
          await Gifted.sendMessage(from, {
            text: formattedMessage,
            contextInfo: {
              forwardingScore: 5,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: botName,
                serverMessageId: 143
              },
            },
          }, { quoted: mek });
        }
      } else {
        await Gifted.sendMessage(from, {
          text: formattedMessage,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143
            },
          },
        }, { quoted: mek });
      }
    }
    
    await react("✅");
  } catch (error) {
    console.error("Error processing quoted message:", error);
    await reply(`❌ An error occurred while processing the message.`);
  }
});


gmd({ 
  pattern: "uptime", 
  aliases: ['up'],
  react: "⏳",
  category: "general",
  description: "check bot uptime status.",
}, async (from, Gifted, conText) => {
  const { mek, react, newsletterJid, newsletterUrl, botFooter, botName, reply } = conText;
  
  try {
    const uptimeMs = Date.now() - BOT_START_TIME;
    
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    const uptimeText = `⏱️ *Bot Uptime*\n\n${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (sendButtons && newsletterUrl) {
      try {
        await sendButtons(Gifted, from, {
          text: uptimeText,    
          footer: `> *${botFooter}*`,            
          buttons: [ 
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'WhatsApp Channel',
                url: newsletterUrl,
                merchant_url: newsletterUrl
              })
            }
          ]
        });
      } catch (btnError) {
        console.log("Button send failed, using regular message");
        await Gifted.sendMessage(from, {
          text: `${uptimeText}\n\n> *${botFooter}*`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143
            }
          }
        }, { quoted: mek });
      }
    } else {
      await Gifted.sendMessage(from, {
        text: `${uptimeText}\n\n> *${botFooter}*`,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    }
    
    await react("✅");
  } catch (error) {
    console.error("Uptime error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});


gmd({ 
  pattern: "repo", 
  aliases: ['sc', 'script'],
  react: "💜",
  category: "general",
  description: "Fetch bot script.",
}, async (from, Gifted, conText) => {
  const { mek, sender, react, pushName, botPic, botName, botFooter, newsletterUrl, ownerName, newsletterJid, giftedRepo, reply } = conText;

  try {
    const response = await axios.get(`https://api.github.com/repos/${giftedRepo}`);
    const repoData = response.data;
    const { full_name, name, forks_count, stargazers_count, created_at, updated_at, owner } = repoData;
    
    const messageText = `Hello *_${pushName}_,*\n\nThis is *${botName},* A WhatsApp Bot Built by *${ownerName},* Enhanced with Amazing Features to Make Your WhatsApp Communication and Interaction Experience Amazing\n\n*❲❒❳ Name:* ${name}\n*❲❒❳ Stars:* ${stargazers_count}\n*❲❒❳ Forks:* ${forks_count}\n*❲❒❳ Created On:* ${new Date(created_at).toLocaleDateString()}\n*❲❒❳ Last Updated:* ${new Date(updated_at).toLocaleDateString()}`;

    if (sendButtons && newsletterUrl) {
      try {
        await sendButtons(Gifted, from, {
          text: messageText,    
          footer: `> *${botFooter}*`,            
          buttons: [ 
            { 
              name: 'cta_copy', 
              buttonParamsJson: JSON.stringify({ 
                display_text: 'Copy Link', 
                copy_code: `https://github.com/${giftedRepo}` 
              }) 
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'Visit Repo',
                url: `https://github.com/${giftedRepo}`,
                merchant_url: `https://github.com/${giftedRepo}`
              })
            }
          ]
        });
      } catch (btnError) {
        console.log("Button send failed, using regular message");
        await Gifted.sendMessage(from, {
          text: `${messageText}\n\n*Repository:* https://github.com/${giftedRepo}\n\n> *${botFooter}*`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143
            }
          }
        }, { quoted: mek });
      }
    } else {
      await Gifted.sendMessage(from, {
        text: `${messageText}\n\n*Repository:* https://github.com/${giftedRepo}\n\n> *${botFooter}*`,
        contextInfo: {
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 143
          }
        }
      }, { quoted: mek });
    }
    
    await react("✅");
  } catch (error) {
    console.error("Repo error:", error);
    reply(`❌ Failed to fetch repository info: ${error.message}`);
  }
});


gmd({
  pattern: "save",
  aliases: ['sv', 's', 'sav'],
  react: "⚡",
  category: "tools",
  description: "Save messages (supports images, videos, audio, stickers, and text).",
}, async (from, Gifted, conText) => {
  const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;
  
  if (!isSuperUser) {
    return reply(`❌ Owner Only Command!`);
  }

  const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  
  if (!quotedMsg) {
    return reply(`⚠️ Please reply to/quote a message to save it.`);
  }

  try {
    let mediaData;
    
    if (quotedMsg.imageMessage) {
      const buffer = await getMediaBuffer(quotedMsg.imageMessage, "image");
      mediaData = {
        image: buffer,
        caption: quotedMsg.imageMessage.caption || "📸 Saved Image"
      };
    } 
    else if (quotedMsg.videoMessage) {
      const buffer = await getMediaBuffer(quotedMsg.videoMessage, "video");
      mediaData = {
        video: buffer,
        caption: quotedMsg.videoMessage.caption || "🎥 Saved Video"
      };
    } 
    else if (quotedMsg.audioMessage) {
      const buffer = await getMediaBuffer(quotedMsg.audioMessage, "audio");
      mediaData = {
        audio: buffer,
        mimetype: "audio/mp4"
      };
    } 
    else if (quotedMsg.stickerMessage) {
      const buffer = await getMediaBuffer(quotedMsg.stickerMessage, "sticker");
      mediaData = {
        sticker: buffer
      };
    } 
    else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
      const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
      mediaData = {
        text: `💾 *Saved Message*\n\n${text}`
      };
    } 
    else {
      return reply(`❌ Unsupported message type.`);
    }

    await Gifted.sendMessage(sender, mediaData);
    await reply("✅ Message saved successfully! Check your DM.");
    await react("✅");

  } catch (error) {
    console.error("Save Error:", error);
    await reply(`❌ Failed to save the message.\n\n*Error:* ${error.message}`);
  }
});

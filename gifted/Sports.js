

const { gmd } = require('../gift');
const axios = require('axios');
const { generateWAMessageContent, generateWAMessageFromContent } = require('gifted-baileys');
//==========================================================================
//==========================================================================
gmd({
  pattern: "surebet",
  aliases: ["bettips", "odds", "predict", "bet", "sureodds"],
  description: "Get betting tips and odds",
  category: "Sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply, botName } = conText;

  try {
    const { data } = await axios.get("https://apiskeith.vercel.app/bet");
    if (!data?.status || !data?.result?.length) {
      return reply("❌ No betting tips available right now.");
    }

    let txt = `🎲 *${botName} Betting Tips & Odds*\n\n`;

    data.result.forEach((match, i) => {
      txt += `*${i + 1}. ${match.match}*\n`;
      txt += `League: ${match.league}\n`;
      txt += `Time: ${match.time}\n\n`;

      if (match.predictions?.fulltime) {
        txt += `Fulltime Odds:\n`;
        txt += `  🏠 Home: ${match.predictions.fulltime.home}%\n`;
        txt += `  🤝 Draw: ${match.predictions.fulltime.draw}%\n`;
        txt += `  🚀 Away: ${match.predictions.fulltime.away}%\n`;
      }

      if (match.predictions?.over_2_5) {
        txt += `Over 2.5 Goals:\n`;
        txt += `  ✅ Yes: ${match.predictions.over_2_5.yes}%\n`;
        txt += `  ❌ No: ${match.predictions.over_2_5.no}%\n`;
      }

      if (match.predictions?.bothTeamToScore) {
        txt += `Both Teams To Score:\n`;
        txt += `  ✅ Yes: ${match.predictions.bothTeamToScore.yes}%\n`;
      }

      if (typeof match.predictions?.value_bets !== "undefined") {
        txt += `Value Bets: ${match.predictions.value_bets}\n`;
      }

      txt += `\n──────────────────────\n\n`;
    });

    await Gifted.sendMessage(from, { text: txt }, { quoted: mek });
  } catch (err) {
    console.error("Bet command error:", err);
    reply("❌ Failed to fetch betting tips. Try again later.");
  }
});
//==========================================================================
gmd({
  pattern: "livescore",
  aliases: ["live", "score", "fixtures"],
  description: "Get live, finished, or upcoming football matches",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply, timeZone } = conText;

  const caption = `╭═════════════════⊷
║  ⚽ *Football Scores* ⚽
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗔𝗬 𝗪𝗜𝗧𝗛 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Live Matches 🔴
║ 2. Finished Matches ✅
║ 3. Upcoming Matches ⏰
╰═════════════════⊷`;

  const sent = await Gifted.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  Gifted.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply || chatId !== from) return;

    const choice = responseText.trim();
    
    const optionMap = {
      "1": { name: "Live", emoji: "🔴" },
      "2": { name: "Finished", emoji: "✅" },
      "3": { name: "Upcoming", emoji: "⏰" }
    };

    if (!optionMap[choice]) {
      return Gifted.sendMessage(chatId, {
        text: "❌ Invalid option. Reply with 1, 2, or 3.",
        quoted: msg
      });
    }

    const selected = optionMap[choice];

    try {
      await Gifted.sendMessage(chatId, { react: { text: selected.emoji, key: msg.key } });

      // Fetch all matches
      const res = await axios.get("https://apiskeith.vercel.app/livescore");
      const data = res.data;

      if (!data.status || !data.result || !data.result.games) {
        return Gifted.sendMessage(chatId, {
          text: `❌ No match data available at the moment.`,
          quoted: msg
        });
      }

      const games = Object.values(data.result.games);
      
      // Get user's timezone from context or default
      const userTimeZone = timeZone || "Africa/Nairobi";
      
      // Get current time in user's timezone
      const now = new Date();
      const currentUserTimeStr = now.toLocaleTimeString("en-US", {
        timeZone: userTimeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
      });
      
      // Filter matches based on status
      let filteredGames = [];

      games.forEach(game => {
        const matchStatus = game.R?.st || ""; 
        
        const userMatchTime = convertToUserTime(game.tm, game.dt, userTimeZone);
        
        let category = "";
        
        if (matchStatus === '1T' || matchStatus === '2T' || matchStatus === 'HT') {
          category = "live";
        } else if (matchStatus === 'FT' || matchStatus === 'Pen') {
          category = "finished";
        } else if (matchStatus === '' || matchStatus === 'Pst' || matchStatus === 'Canc') {
          category = "upcoming";
        }
        
        if (category && (
          (choice === "1" && category === "live") ||
          (choice === "2" && category === "finished") ||
          (choice === "3" && category === "upcoming")
        )) {
          filteredGames.push({
            ...game,
            category,
            userMatchTime: userMatchTime ? userMatchTime.time : game.tm,
            userMatchDate: userMatchTime ? userMatchTime.date : game.dt
          });
        }
      });

      if (filteredGames.length === 0) {
        return Gifted.sendMessage(chatId, {
          text: `⚽ *${selected.name} Matches*\n\nNo ${selected.name.toLowerCase()} matches found at the moment.`,
          quoted: msg
        });
      }

      const matchesByDate = {};
      
      filteredGames.forEach(game => {
        const date = game.userMatchDate || game.dt || "Today";
        
        if (!matchesByDate[date]) {
          matchesByDate[date] = [];
        }
        
        matchesByDate[date].push(game);
      });

      let output = `⚽ *${selected.name} Matches* ${selected.emoji}\n`;
      output += `🌍 Timezone: ${userTimeZone}\n`;
      output += `🕐 Current Time: ${currentUserTimeStr}\n\n`;
      
      let totalMatches = 0;
      
      Object.entries(matchesByDate).forEach(([date, dateGames]) => {
        output += `📅 *${date}*\n`;
        output += "─".repeat(30) + "\n";
        
        dateGames.forEach(game => {
          const status = getMatchDisplay(game);
          const score = getScoreDisplay(game);
          
          output += `${status} *${game.p1} vs ${game.p2}*\n`;
          output += `   ${score}\n`;
          
          if (game.userMatchTime) {
            output += `   🕒 ${game.userMatchTime}`;
            const statusText = getMatchStatusText(game.R?.st);
            if (statusText) {
              output += ` (${statusText})`;
            }
          } else if (game.tm) {
            output += `   🕒 ${game.tm}`;
          }
          
          output += "\n\n";
          totalMatches++;
        });
      });

      output += `📊 Total: ${totalMatches} match(es)`;

      await Gifted.sendMessage(chatId, { text: output }, { quoted: msg });

    } catch (err) {
      console.error("livescore error:", err);
      await Gifted.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} matches: ${err.message}`,
        quoted: msg
      });
    }
  });
});

// Helper functions
function convertToUserTime(timeStr, dateStr, userTimeZone) {
  if (!timeStr || !dateStr) return null;
  
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    
    const userDateStr = utcDate.toLocaleDateString("en-US", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    
    const userTimeStr = utcDate.toLocaleTimeString("en-US", {
      timeZone: userTimeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const [userMonth, userDay, userYear] = userDateStr.split('/');
    const formattedDate = `${userYear}-${userMonth.padStart(2, '0')}-${userDay.padStart(2, '0')}`;
    
    return {
      date: formattedDate,
      time: userTimeStr
    };
  } catch (e) {
    console.error("Time conversion error:", e);
    return null;
  }
}

function getMatchDisplay(game) {
  const status = game.R?.st || "";
  
  if (status === 'HT') return "⏸️";
  if (status === 'FT' || status === 'Pen') return "✅";
  if (status === '1T' || status === '2T') return "🔴";
  
  return game.category === "upcoming" ? "⏰" : "⚽";
}

function getMatchStatusText(status) {
  const statusMap = {
    '': 'Not Started',
    'FT': 'Full Time',
    '1T': 'First Half',
    '2T': 'Second Half',
    'HT': 'Half Time',
    'Pst': 'Postponed',
    'Canc': 'Cancelled',
    'Pen': 'Penalties'
  };
  
  return statusMap[status] || status;
}

function getScoreDisplay(game) {
  if (game.R && game.R.r1 !== undefined && game.R.r2 !== undefined) {
    return `📊 ${game.R.r1} - ${game.R.r2}`;
  }
  return "📊 0 - 0";
}
//==========================================================================
function formatDate(ts) {
  try {
    const d = new Date(Number(ts));
    return d.toDateString(); // e.g. "Fri Dec 05 2025"
  } catch {
    return "Unknown Date";
  }
}

gmd({
  pattern: "sportnews",
  aliases: ["footballnews", "soccernews"],
  category: "sports",
  description: "Get latest football news",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek } = conText;

  try {
    const apiUrl = `https://apiskeith.vercel.app/football/news`;
    const res = await axios.get(apiUrl, { timeout: 100000 });
    const items = res.data?.result?.data?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const news = items.slice(0, 8); // limit to 8 cards
    const cards = await Promise.all(news.map(async (item) => ({
      header: {
        title: `📰 ${item.title}`,
        hasMediaAttachment: true,
        imageMessage: (await generateWAMessageContent({ image: { url: item.cover?.url } }, {
          upload: Gifted.waUploadToServer
        })).imageMessage
      },
      body: {
        text: `${item.summary}`
      },
      footer: { text: formatDate(item.createdAt) },
      nativeFlowMessage: {
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "🔗 Read More",
              url: "https://keithsite.vercel.app/sports"
            })
          },
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Link",
              copy_code: "https://keithsite.vercel.app/sports"
            })
          }
        ]
      }
    })));

    const message = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: {
            body: { text: `⚽ Latest Football News` },
            footer: { text: `📂 Showing ${news.length} stories` },
            carouselMessage: { cards }
          }
        }
      }
    }, { quoted: mek });

    await Gifted.relayMessage(from, message.message, { messageId: message.key.id });

  } catch (err) {
    console.error("sportnews command error:", err);
  }
});
//==========================================================================
gmd({
  pattern: "topscorers",
  aliases: ["scorers", "goals"],
  description: "View top goal scorers across major football leagues",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply } = conText;

  const caption = `╭═════════════════⊷
║  ⚽ *Top Scorers* ⚽
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await Gifted.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  Gifted.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: "https://apiskeith.vercel.app/epl/scorers" },
      "2": { name: "Bundesliga", url: "https://apiskeith.vercel.app/bundesliga/scorers" },
      "3": { name: "La Liga", url: "https://apiskeith.vercel.app/laliga/scorers" },
      "4": { name: "Ligue 1", url: "https://apiskeith.vercel.app/ligue1/scorers" },
      "5": { name: "Serie A", url: "https://apiskeith.vercel.app/seriea/scorers" },
      "6": { name: "UEFA Champions League", url: "https://apiskeith.vercel.app/ucl/scorers" },
      "7": { name: "FIFA International", url: "https://apiskeith.vercel.app/fifa/scorers" },
      "8": { name: "UEFA Euro", url: "https://apiskeith.vercel.app/euros/scorers" }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return Gifted.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await Gifted.sendMessage(chatId, { react: { text: "⚽", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.topScorers)) {
        return Gifted.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} scorers.`,
          quoted: msg
        });
      }

      const scorers = data.result.topScorers.map(scorer => {
        let medal = "";
        if (scorer.rank === 1) medal = "🥇";
        else if (scorer.rank === 2) medal = "🥈";
        else if (scorer.rank === 3) medal = "🥉";

        return `${medal} *${scorer.rank}. ${scorer.player}* (${scorer.team})\n` +
               `⚽ Goals: ${scorer.goals} | 🎯 Assists: ${scorer.assists}\n` +
               `🎯 Penalties: ${scorer.penalties}`;
      }).join("\n\n");

      const caption = `📊 *Top Scorers – ${data.result.competition}*\n\n${scorers}`;

      await Gifted.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("topscorers error:", err);
      await Gifted.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} scorers: ${err.message}`,
        quoted: msg
      });
    }
  });
});
    
//
//==========================================================================
gmd({
  pattern: "standings",
  aliases: ["leaguetable", "league"],
  description: "View current league standings across major competitions",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply } = conText;

  const caption = `╭═════════════════⊷
║  📊 *League Standings* 📊
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await Gifted.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  Gifted.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: "https://apiskeith.vercel.app/epl/standings" },
      "2": { name: "Bundesliga", url: "https://apiskeith.vercel.app/bundesliga/standings" },
      "3": { name: "La Liga", url: "https://apiskeith.vercel.app/laliga/standings" },
      "4": { name: "Ligue 1", url: "https://apiskeith.vercel.app/ligue1/standings" },
      "5": { name: "Serie A", url: "https://apiskeith.vercel.app/seriea/standings" },
      "6": { name: "UEFA Champions League", url: "https://apiskeith.vercel.app/ucl/standings" },
      "7": { name: "FIFA International", url: "https://apiskeith.vercel.app/fifa/standings" },
      "8": { name: "UEFA Euro", url: "https://apiskeith.vercel.app/euros/standings" }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return Gifted.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await Gifted.sendMessage(chatId, { react: { text: "📊", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.standings)) {
        return Gifted.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} standings.`,
          quoted: msg
        });
      }

      const standings = data.result.standings.map(team => {
        let tag = "🧱"; // mid-table default
        if (team.position <= 4) tag = "🏆"; // Champions League
        else if (team.position === 5 || team.position === 6) tag = "🥈"; // Europa League
        else if (team.position >= 18) tag = "⚠️"; // Relegation

        return `${tag} *${team.position}. ${team.team}*\n` +
               `Played: ${team.played} | W:${team.won} D:${team.draw} L:${team.lost}\n` +
               `Points: ${team.points} | GD: ${team.goalDifference}`;
      }).join("\n\n");

      const caption = `📊 *${data.result.competition} Standings*\n\n${standings}`;

      await Gifted.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("standings error:", err);
      await Gifted.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} standings: ${err.message}`,
        quoted: msg
      });
    }
  });
});
//==========================================================================
gmd({
  pattern: "upcomingmatches",
  aliases: ["fixtures", "upcoming", "nextgames"],
  description: "View upcoming matches across major football leagues",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply } = conText;

  const caption = `╭═════════════════⊷
║  📅 *Upcoming Matches* 📅
║━━━━━━━━━━━━━━━━━
║ 𝗥𝗘𝗣𝗟𝗬 𝗪𝗜𝗧𝗛 𝗟𝗘𝗔𝗚𝗨𝗘 𝗡𝗨𝗠𝗕𝗘𝗥
║ 1. Premier League
║ 2. Bundesliga
║ 3. La Liga
║ 4. Ligue 1
║ 5. Serie A
║ 6. UEFA Champions League
║ 7. FIFA International
║ 8. UEFA Euro
╰═════════════════⊷`;

  const sent = await Gifted.sendMessage(from, { text: caption }, { quoted: mek });
  const messageId = sent.key.id;

  Gifted.ev.on("messages.upsert", async (update) => {
    const msg = update.messages[0];
    if (!msg.message) return;

    const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
    const chatId = msg.key.remoteJid;

    if (!isReply) return;

    const leagueMap = {
      "1": { name: "Premier League", url: "https://apiskeith.vercel.app/epl/upcomingmatches" },
      "2": { name: "Bundesliga", url: "https://apiskeith.vercel.app/bundesliga/upcomingmatches" },
      "3": { name: "La Liga", url: "https://apiskeith.vercel.app/laliga/upcomingmatches" },
      "4": { name: "Ligue 1", url: "https://apiskeith.vercel.app/ligue1/upcomingmatches" },
      "5": { name: "Serie A", url: "https://apiskeith.vercel.app/seriea/upcomingmatches" },
      "6": { name: "UEFA Champions League", url: "https://apiskeith.vercel.app/ucl/upcomingmatches" },
      "7": { name: "FIFA International", url: "https://apiskeith.vercel.app/fifa/upcomingmatches" },
      "8": { name: "UEFA Euro", url: "https://apiskeith.vercel.app/euros/upcomingmatches" }
    };

    const selected = leagueMap[responseText.trim()];
    if (!selected) {
      return Gifted.sendMessage(chatId, {
        text: "❌ Invalid league number. Reply with a number between 1 and 8.",
        quoted: msg
      });
    }

    try {
      await Gifted.sendMessage(chatId, { react: { text: "📅", key: msg.key } });

      const res = await axios.get(selected.url);
      const data = res.data;

      if (!data.status || !Array.isArray(data.result?.upcomingMatches)) {
        return Gifted.sendMessage(chatId, {
          text: `❌ Failed to fetch ${selected.name} fixtures.`,
          quoted: msg
        });
      }

      const fixtures = data.result.upcomingMatches.map(match =>
        `📅 *Matchday ${match.matchday}*\n🕒 ${match.date}\n🏟️ ${match.homeTeam} vs ${match.awayTeam}`
      ).join("\n\n");

      const caption = `🏆 *Upcoming ${selected.name} Matches*\n\n${fixtures}`;

      await Gifted.sendMessage(chatId, { text: caption }, { quoted: msg });
    } catch (err) {
      console.error("upcomingmatches error:", err);
      await Gifted.sendMessage(chatId, {
        text: `❌ Error fetching ${selected.name} schedule: ${err.message}`,
        quoted: msg
      });
    }
  });
});
//==========================================================================
gmd({
  pattern: "gamehistory",
  aliases: ["matchevents", "gameevents"],
  description: "View historical or upcoming game events between teams",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { q, reply, mek } = conText;

  if (!q || !q.includes("vs")) {
    return reply("❌ Provide a valid match query.\n\nExample: gamehistory Arsenal vs Chelsea");
  }

  try {
    const res = await axios.get(`https://apiskeith.vercel.app/sport/gameevents?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No game events found for that matchup.");
    }

    for (const match of data.result.slice(0, 3)) {
      const { teams, league, venue, dateTime, status, season, media } = match;
      const caption = `⚽ *${match.match}*\n\n` +
        `🏆 League: ${league.name} (${season})\n` +
        `📅 Date: ${dateTime.date} at ${dateTime.time}\n` +
        `📍 Venue: ${venue.name || "—"} (${venue.country || "—"})\n` +
        `🔢 Round: ${match.round}\n` +
        `📶 Status: ${status}\n\n` +
        `🔴 ${teams.home.name}: ${teams.home.score ?? "—"}\n` +
        `🔵 ${teams.away.name}: ${teams.away.score ?? "—"}\n\n` +
        (match.media.video ? `▶️ Video: ${match.media.video}` : "");

      const mediaMsg = match.media?.poster || match.media?.thumb
        ? { image: { url: match.media.poster || match.media.thumb }, caption }
        : { text: caption };

      await Gifted.sendMessage(from, mediaMsg, { quoted: mek });
    }
  } catch (err) {
    console.error("gamehistory error:", err);
    reply("❌ Error fetching game history: " + err.message);
  }
});
//========================================================================================================================

gmd({
  pattern: "venuesearch",
  aliases: ["venue", "stadium"],
  description: "Search for sports venues by name",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { q, reply, mek } = conText;

  if (!q) return reply("❌ Provide a venue name.\n\nExample: venuesearch Emirates");

  try {
    const res = await axios.get(`https://apiskeith.vercel.app/sport/venuesearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching venues found. Try a different name.");
    }

    for (const venue of data.result.slice(0, 3)) {
      const caption = `🏟️ *${venue.name}*\n\n` +
        `📛 Alternate Name: ${venue.alternateName || "—"}\n` +
        `⚽ Sport: ${venue.sport || "—"}\n` +
        `📍 Location: ${venue.location || "—"}\n` +
        `🌍 Country: ${venue.country || "—"}\n` +
        `📅 Built: ${venue.yearBuilt || "—"}\n` +
        `👥 Capacity: ${venue.capacity || "—"}\n` +
        `🕒 Timezone: ${venue.timezone || "—"}\n\n` +
        `📝 *Description*\n${venue.description?.split("\r\n").slice(0, 2).join("\n") || "—"}`;

      const media = venue.media?.thumb
        ? { image: { url: venue.media.thumb }, caption }
        : { text: caption };

      await Gifted.sendMessage(from, media, { quoted: mek });
    }
  } catch (err) {
    console.error("venuesearch error:", err);
    reply("❌ Error fetching venue data: " + err.message);
  }
});
//==========================================================================
gmd({
  pattern: "teamsearch",
  aliases: ["team", "club"],
  description: "Search for sports teams by name",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { q, reply, mek } = conText;

  if (!q) return reply("❌ Provide a team name.\n\nExample: teamsearch Arsenal");

  try {
    const res = await axios.get(`https://apiskeith.vercel.app/sport/teamsearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching teams found. Try a different name.");
    }

    const team = data.result[0];
    const caption = `🏟️ *${team.name}*\n\n` +
      `📛 Alternate Names: ${team.alternateName}\n` +
      `📅 Formed: ${team.formedYear}\n` +
      `⚽ Sport: ${team.sport}\n` +
      `🏆 League: ${team.league}\n` +
      `📍 Location: ${team.location}, ${team.country}\n` +
      `🚻 Gender: ${team.gender}\n` +
      `🏟️ Stadium: ${team.stadium} (${team.stadiumCapacity} capacity)\n\n` +
      `🌐 *Social Links*\n` +
      `🔗 Website: ${team.social.website}\n` +
      `📘 Facebook: ${team.social.facebook}\n` +
      `🐦 Twitter: ${team.social.twitter}\n` +
      `📸 Instagram: ${team.social.instagram}\n` +
      `📺 YouTube: ${team.social.youtube}\n\n` +
      `📝 *Description*\n${team.description.split("\r\n").slice(0, 3).join("\n")}`;

    await Gifted.sendMessage(from, {
      image: { url: team.badges.large },
      caption
    }, { quoted: mek });
  } catch (err) {
    console.error("teamsearch error:", err);
    reply("❌ Error fetching team data: " + err.message);
  }
});
//========================================================================================================================
//
gmd({
  pattern: "playersearch",
  aliases: ["player", "athlete"],
  description: "Search for sports players by name",
  category: "sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { q, reply, mek } = conText;

  if (!q) return reply("❌ Provide a player name.\n\nExample: playersearch Bukayo Saka");

  try {
    const res = await axios.get(`https://apiskeith.vercel.app/sport/playersearch?q=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
      return reply("❌ No matching players found. Try a different name.");
    }

    for (const player of data.result.slice(0, 3)) {
      const caption = `🏅 *${player.name}*\n\n` +
        `🏟️ Team: ${player.team}\n` +
        `⚽ Sport: ${player.sport}\n` +
        `🌍 Nationality: ${player.nationality}\n` +
        `🎂 Birthdate: ${player.birthDate}\n` +
        `📌 Position: ${player.position}\n` +
        `📶 Status: ${player.status}\n` +
        `🚻 Gender: ${player.gender}`;

      const media = player.thumbnail
        ? { image: { url: player.thumbnail }, caption }
        : { text: caption };

      await Gifted.sendMessage(from, media, { quoted: mek });
    }
  } catch (err) {
    console.error("playersearch error:", err);
    reply("❌ Error fetching player data: " + err.message);
  }
});
//==========================================================================
//==========================================================================
//==========================================================================
//==========================================================================
//==========================================================================

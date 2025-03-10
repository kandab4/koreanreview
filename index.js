const { Client, GatewayIntentBits, Events } = require('discord.js');
const { Collection } = require("@discordjs/collection");
const { spawn } = require("child_process")

const client = new Client({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

require('dotenv').config();

function array2Collection(messages) {
    return new Collection(messages.slice().sort((a, b) => {
        const a_id = BigInt(a.id);
        const b_id = BigInt(b.id);
        return (a_id > b_id ? 1 : (a_id === b_id ? 0 : -1));
    }).map(e => [e.id, e]));
}

async function fetchMany(channel, options = { limit: 50 }) {
 if ((options.limit ?? 50) <= 100) {
   return channel.messages.fetch(options);
 }
  
 if (typeof options.around === "string") {
   const messages = await channel.messages.fetch({ ...options, limit: 100 });
   const limit = Math.floor((options.limit - 100) / 2);
   if (messages.size < 100) {
     return messages;
   }
   const backward = fetchMany(channel, { limit, before: messages.last().id });
   const forward = fetchMany(channel, { limit, after: messages.first().id });
   return array2Collection([messages, ...await Promise.all([backward, forward])].flatMap(
     e => [...e.values()]
   ));
 }
 let temp;
 function buildParameter() {
   const req_cnt = Math.min(options.limit - messages.length, 100);
   if (typeof options.after === "string") {
     const after = temp
       ? temp.first().id : options.after
     return { ...options, limit: req_cnt, after };
   }
   const before = temp
     ? temp.last().id : options.before;
   return { ...options, limit: req_cnt, before };
 }
 const messages = [];
 while (messages.length < options.limit) {
   const param = buildParameter();
   temp = await channel.messages.fetch(param);
   messages.push(...temp.values());
   if (param.limit > temp.size) {
     break;
   }
 }
 return array2Collection(messages);
}

function formatKoreanDateWithHangul(date) {
    // Dateオブジェクトを受け取り、韓国形式でフォーマットされた文字列を返す関数

    // 年、月、日、時、分、秒を取得
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1); // 月は0から始まるので+1
    const day = String(date.getDate());
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 韓国形式でフォーマット (ハングル付き)
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
}

client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.channel.name != "복습") return;

    if (message.content === '!ping') {
        message.channel.send('Pong!');
    }
    if (message.content.includes('こんにちは')) {
        message.channel.send('こんにちは！');
    }

    var memoChannel = message.guild.channels.cache.find((channel) => channel.name === "메모");

    let messages = []
    let dates = []
    const fetchedMessages = await fetchMany(memoChannel, {
        limit: 400,
        // before: "818529905184604180"
        after: "0"
    })
    
    fetchedMessages.forEach(msg => {
        messages.push(`${msg.content}`);
        dates.push(`(${formatKoreanDateWithHangul(msg.createdAt)})`);
    });

    var rand = Math.floor(Math.random() * messages.length) + 1
    // console.log(messages[rand]);
    // console.log(messages.length);

    message.channel.send(messages[rand]);
    message.channel.send(dates[rand]);
});
client.login(process.env.DISCORD_TOKEN);
const { App } = require("@slack/bolt");
const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// 起動した時にトークンを取得して使い回すためにインスタンスのガワを作成
let axiosInstance;

const m2mHeaders = { "content-type": "application/json" };
const body = {
  client_id: process.env.AUTH0_CLIENT_ID,
  client_secret: process.env.AUTH0_SECRET,
  audience: process.env.AUTH0_AUDIENCE,
  grant_type: "client_credentials",
};

const fetchToken = new Promise((resolve, reject) => {
  try {
    let res;
    // Auth0側でM2Mトークンの発行回数は1000/monthまでなので開発中は、同じトークンを使い回す
    if (process.env.PROD === "true") {
      // 本稼働中は起動ごとに毎回取得する
      res = axios.post(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        body,
        m2mHeaders
      );
    } else {
      res = {
        data: {
          access_token: process.env.AUTH0_DUMMY_TOKEN,
        },
      };
    }
    resolve(res);
  } catch (error) {
    console.log("err");
    resolve("reject");
    console.error(error);
  }
});

// Slack接続作成
const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command("/quest", async ({ command, ack, say }) => {
  try {
    await ack();
    const response = await axiosInstance.get("quest/");
    quests = response.data.quests;

    await say(fs.readFileSync("./src/messages/header.json", "utf8"));

    // msgBlocksのBlocksに追加していく
    let msgBlocks = { blocks: [] };
    quests.map(async (quest) => {
      let msgTemplate = JSON.parse(
        fs.readFileSync("./src/messages/questMsg.json", "utf8")
      );
      msgTemplate.blocks[0].text.text = `*${quest.title}*\n*${quest.reward}* point`;
      msgTemplate.blocks[1].elements[0].text = quest.description;
      msgTemplate.blocks[2].accessory.value = String(quest.id);
      msgBlocks.blocks.push(...msgTemplate.blocks);
    });
    await say(msgBlocks);
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

app.message(async ({ message, say }) => {
  console.log(message);
});

app.action("report", async ({ ack, say, body, client, logger }) => {
  await ack();
  say(`<@${body.user.id}> \n*let's report!!*`);
  console.log(body);
});

//起動時の処理/////////////////////////////////////////////////////
fetchToken.then((value) => {
  axiosInstance = axios.create({
    baseURL: process.env.API_URL,
    headers: {
      Authorization: `Bearer ${value.data.access_token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("M2M auth success");
});
////////////////////////////////////////////////////////////////////
app.start(process.env.PORT);
console.log(`Listen: ${process.env.PORT}`);

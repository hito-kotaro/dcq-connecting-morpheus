const { App } = require("@slack/bolt");
const fs = require('fs');
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// 起動した時にトークンを取得して使い回すためにインスタンスのガワを作成
let axiosInstance;
const jsonObject = JSON.parse(fs.readFileSync('./src/messages/questMsg.json', 'utf8'));
const m2mHeaders = { "content-type": "application/json" };
const body = {
  client_id: process.env.AUTH0_CLIENT_ID,
  client_secret: process.env.AUTH0_SECRET,
  audience: process.env.AUTH0_AUDIENCE,
  grant_type: "client_credentials",
};

console.log(jsonObject)
const fetchToken = new Promise((resolve, reject) => {
  try {
    // Auth0側でM2Mトークンの発行回数は1000/monthまでなので開発中は、同じトークンを使い回す
    // const res = {
    //   data: {
    //     access_token: process.env.AUTH0_DUMMY_TOKEN,
    //   },
    // };

    // 本稼働中は起動ごとに毎回取得する
    const res = axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      body,
      m2mHeaders
    );
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
    quests = response.data.quests
    let blocks = []
    quests.map(async (quest) => {
      blocks.push(questMsg.questBlock.block)
      // quest情報を取得
      // 置換して配列に入れる
    })
    console.log(blocks)
    await say(jsonObject)
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});


app.message('hello', async ({ message, say }) => {
  console.log('hello')
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

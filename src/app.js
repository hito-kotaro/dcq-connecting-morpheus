const { App } = require("@slack/bolt");
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
    const quests = await axiosInstance.get("quest/");
    console.log(quests.data);
    say("fetch quest");
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

//起動時の処理/////////////////////////////////////////////////////
fetchToken.then((value) => {
  axiosInstance = axios.create({
    baseURL: `https://${process.env.API_DOMAIN}/`,
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
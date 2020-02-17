'use strict';

const language = require('@google-cloud/language');
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require("axios");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const config = {
  channelAccessToken: process.env.YOURTOKEN,
  channelSecret: process.env.YOUR_SECRET,
};

const app = express();
const client_line = new line.Client(config);
const client_lang = new language.LanguageServiceClient();

let eva = 0;

// 応答処理
const Analyze = async (text,event,userId) => {
  let replyText = "";
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  client_lang
  .analyzeSentiment({document: document})
  .then(results => {
    const sentiment = results[0].documentSentiment;
    pushText(`スコア: ${rounding(sentiment.score)}`,userId);
    evalResult(sentiment.score,userId)
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
}

// 有効数字の処理
const rounding = (num) =>{
  return Math.floor(num * 10)/10;
}

// テキスト送信処理
const pushText = (mes,userId) => {
  client_line.pushMessage(userId,{
    type: "text",
    text: mes,
  })
}

// 判定内容送信。ここカスタマイズすればいろいろアレンジできます

const evalResult = (num,userId) => {
  let opinion = 1;
  if(num >= 0.8){
    opinion =  "脈アリ間違いなし！\u{100078}\u{100033}"
  }else if(num >= 0.4){
    opinion =  "希望はあるよ\u{10008F}";
  }else if(num >= 0){
    opinion =  "まだ様子見しよう\u{10002E}\u{100031}";
  }else if(num <= -0.6){
    opinion =  "これは脈ナシ…\u{10007D}";
  }else{
    opinion = "ちょっと怪しいかも\u{10007B}";
  }
  setTimeout(() => {
    client_line.pushMessage(userId,{
      type: "text",
      text: opinion,
    })
  },2000);
}

// メッセージ入力
const handleEvent = (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  const sentText = event.message.text;
  const userId = event.source.userId;
  let message = "";

  if(event.message.text !== ""){
    message = `「${sentText}」の脈を測ります`;
    Analyze(sentText,event,userId);
  }

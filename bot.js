const { Client, LocalAuth, MessageMedia, List, Location, Message } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode') && require('qrcode-terminal');
const http = require('http');
const fileUpload = require('express-fileupload');
const { generateImage, cleanNumber, checkEnvFile, createClient, isValidNumber } = require('./controllers/handle')
const { connectionReady, connectionLost } = require('./controllers/connection')
const axios = require('axios');
const port = 4000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
//const mime = require('mime-types');
const DIR_MEDIA = `${__dirname}/../mediaSend`;
const ExcelJS = require('exceljs');
const moment = require('moment');
const fs = require('fs');


const tempoBot = 3600000
const tempoChat = 1800000
const tempoMessageTo = 600000
const dirBot = './bot'
const dirChat = './chat'
const dirMsgTo = './msgto'

const sendMediaVoiceNote = (client, number = null, fileName = null) => {

  setTimeout(async () => {
  number = cleanNumber(number || 0)
  const file = `./mediaSend/${fileName}`;
  if (fs.existsSync(file)) {
         const media = MessageMedia.fromFilePath(file);
         client.sendMessage(number, media ,{ sendAudioAsVoice: true });
         console.log('⚡⚡⚡ Enviando Audio....');
     }
  else{
    console.log('Arquivo de Audio não encontrado', file);
  }
    }
 ,270);
}
 

if (!fs.existsSync(dirBot)){
    fs.mkdirSync(dirBot)
}

if (!fs.existsSync(dirChat)){
  fs.mkdirSync(dirChat)
}

if (!fs.existsSync(dirMsgTo)){
  fs.mkdirSync(dirMsgTo)
}

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}
;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-MFA' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.on('message_create', async message => {
  
  const jid = message.to;
  const dirMsgTo = './msgto/' + jid.replace(/\D/g,'');
  const from = jid.replace(/\D/g,'');

  async function readWriteMsgToJson(msgToStatus) {
    let dataFile = [];
    fs.writeFileSync("./msgto/" + from + "/msgto.json", JSON.stringify(dataFile));
    var data = fs.readFileSync("./msgto/" + from + "/msgto.json");
    var myObject = JSON.parse(data);
    let newData = {
      status: msgToStatus,
    };
    await myObject.push(newData);
    fs.writeFileSync("./msgto/" + from + "/msgto.json", JSON.stringify(myObject));
  }

  if (!fs.existsSync(dirMsgTo)){
    fs.mkdirSync(dirMsgTo);
    await readWriteMsgToJson("on");
  }

  await readWriteMsgToJson("on");

});

const listenMessage = () => client.on('message', async msg => {
  const { body, hasMedia, type, ack } = msg;
  const jid = msg.from
  const dirFrom = './bot/' + jid.replace(/\D/g,'');
  const dirChat = './chat/' + jid.replace(/\D/g,'');
  const dirMsgTo = './msgto/' + jid.replace(/\D/g,'');
  const from = jid.replace(/\D/g,'');

  async function readWriteMsgToJson(msgToStatus) {
      let dataFile = [];
      fs.writeFileSync("./msgto/" + from + "/msgto.json", JSON.stringify(dataFile));
      var data = fs.readFileSync("./msgto/" + from + "/msgto.json");
      var myObject = JSON.parse(data);
      let newData = {
        status: msgToStatus,
      };
      await myObject.push(newData);
      fs.writeFileSync("./msgto/" + from + "/msgto.json", JSON.stringify(myObject));
  }
  if (!fs.existsSync(dirMsgTo)){
      fs.mkdirSync(dirMsgTo);
      await readWriteMsgToJson("off");
  }

  async function readWriteFileJson(botStatus) {
      let dataFile = [];
      fs.writeFileSync("./bot/" + from + "/bot.json", JSON.stringify(dataFile));
      var data = fs.readFileSync("./bot/" + from + "/bot.json");
      var myObject = JSON.parse(data);
      let newData = {
        status: botStatus,
      };
      await myObject.push(newData);
      fs.writeFileSync("./bot/" + from + "/bot.json", JSON.stringify(myObject));
    }
  if (!fs.existsSync(dirFrom)){
      fs.mkdirSync(dirFrom);
      await readWriteFileJson("on");
  }
  
  async function readWriteChatJson(chatStatus) {
      let dataFile = [];
      fs.writeFileSync("./chat/" + from + "/chat.json", JSON.stringify(dataFile));
      var data = fs.readFileSync("./chat/" + from + "/chat.json");
      var myObject = JSON.parse(data);
      let newData = {
        status: chatStatus,
      };
      await myObject.push(newData);
      fs.writeFileSync("./chat/" + from + "/chat.json", JSON.stringify(myObject));
  }
  if (!fs.existsSync(dirChat)){
      fs.mkdirSync(dirChat);
      await readWriteChatJson("on");
  }

  const status = fs.readFileSync("./bot/" + from + "/bot.json","utf8").split(':')[1].replace(/\W/g, '');
  const statusChat = fs.readFileSync("./chat/" + from + "/chat.json","utf8").split(':')[1].replace(/\W/g, '');
  
  await readWriteMsgToJson("off");

  if (msg.type.toLowerCase() == "e2e_notification") return null;

  if(!isValidNumber(from)){
      return
  }

   // Este bug lo reporto Lucas Aldeco Brescia para evitar que se publiquen estados
  if (from === 'status@broadcast') {
      return
  }

  message = body.toLowerCase();
  const number = cleanNumber(from)
  console.log('Mensagem Recebida:', body.toLowerCase())
  const chat = await msg.getChat();
 
  //mensagem de inicio
  if(status === "on"
  && statusChat === "on"
  && message !== ""
  && message !== null 
  && message.toLowerCase() !== "nao"
  && message.toLowerCase() !== "não"
  && message.toLowerCase() !== "sim"
  && message.toLowerCase() !== "!reset"
  && message.toLowerCase() !== "!teste"
  && message.toLowerCase() !== "!audio"
  && msg.body.toLowerCase() !== "!reset agenda"){
      
      await readWriteFileJson("off");
      await readWriteChatJson("off");
      //gravando audio
      console.log('⚡⚡⚡ Gravando Audio Autoridade....')
      chat.sendStateRecording();
      //enviando mensagens
      delay(23000).then(async function() {
          //enviando audio gravado
          chat.clearState();
          sendMediaVoiceNote(client, from, fileName = 'apresentar-autoriade.mp3');
          //enviando mensagem 1
          delay(5000).then(async function() {
              client.sendMessage(msg.from, 'Da uma olhadinha rápidinho!');
              //Enviando mensagem 2
              delay(9000).then(async function() {
                  client.sendMessage(msg.from, 'https://youtu.be/qxND6x1wFSE');
                  //Enviando mensagem 3
                  delay(300).then(async function() {chat.sendStateTyping();})
                  delay(16000).then(async function() {
                      chat.clearState();
                      client.sendMessage(msg.from, 'No vídeo, eles estão falando sobre os resultados dos primeiros 15 dias!');
                      //Enviando mensagem 4
                      delay(30000).then(async function() {
                          client.sendMessage(msg.from, 'Conseguiu ver?');
                          await readWriteChatJson("on");
                      });
                  });
                 
              });
          });
           
      }); 
  }

  //mensagem de agendamento    
  delay(1500).then(async function(){
  if (status === "off"
  && statusChat === "on"
  && msg.body !== "!reset"
  && msg.body !== "!teste"
  && msg.body !== "!reset agenda"
  && msg.hasMedia !== null) {

      //gravando audio
      await readWriteChatJson("off");
      chat.sendStateRecording();
      console.log('⚡⚡⚡ Gravando Audio Agendamento....')
      //enviando mensagens
      delay(23000).then(async function() { 
          //para de ficar gravando 
          chat.clearState();
          sendMediaVoiceNote(client, from, fileName = 'agendar-reuniao.mp3');
          //escrevendo mensagem
          delay(300).then(async function() {chat.sendStateTyping();})
          //enviando a mensagem
          delay(7300).then(async function() {
              chat.clearState();
              client.sendMessage(msg.from, 'Para agendar uma reunião, clique no link abaixo:\n\n https://calendly.com/arrowshotdigital/sessao-estrategica');
          })
      })
      
  };
  });

  if(message === '!reset'){
      await readWriteFileJson("on");
      await readWriteChatJson("on");
      client.sendMessage(msg.from, 'Resetado com sucesso!');
  }
  if(message === '!reset agenda'){
      await readWriteFileJson("off");
      await readWriteChatJson("on");
      client.sendMessage(msg.from, 'Resetado com sucesso!');
  }
  if(message === '!teste'){
      client.sendMessage(msg.from, 'Teste feito com sucesso!');
  }
  if(message === '!audio'){
    sendMediaVoiceNote(client, from, fileName = 'apresentar-autoriade.mp3');
    client.sendMessage(msg.from, 'enviou?');
}

});
    

client.on('qr', qr => generateImage(qr, () => {
  qrcode.generate(qr, { small: true });
  
  console.log(`Ver QR http://localhost:${port}/qr`)
  socketEvents.sendQR(qr)
}))

client.on('ready', (a) => {
  connectionReady()
  listenMessage()
  // socketEvents.sendStatus(client)
});

client.on('auth_failure', (e) => {
  // console.log(e)
  connectionLost()
});

client.on('authenticated', () => {
  console.log('WhatsApp AUTENTICADO'); 
});

client.initialize();

server.listen(port, function() {
        console.log('Aplicação está rodando na porta: ' + port);
});

 

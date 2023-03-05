import https from "https";
import EventEmitter from "events";
import { WebSocket } from "ws";
import { cookie_U } from "./cookie.js";

const headers = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41",
  "origin": "https://www.bing.com",
  "referer": "https://www.bing.com/",
  "sec-ch-ua": '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
  "sec-ch-ua-platform": "Windows",
  "x-forwarded-for": "4.2.2.2",
  "Cookie": `_U=${cookie_U}`
};

const DELIMITER = "\x1e"

const appendIdentifier = (msg) => JSON.stringify(msg) + DELIMITER;

const ChatHubRequest = (conversation,mode) => {
  let invocationId = 0;
  return (prompt) => {
    const request = {
      arguments: [
        {
          source: "cib",
          optionsSets: [
            "nlu_direct_response_filter",
            "deepleo",
            "disable_emoji_spoken_text",
            "responsible_ai_policy_235",
            "enablemm",
            mode,
            "dtappid",
            "trn8req120",
            "h3ads",
            "rai251",
            "blocklistv2",
            "localtime",
            "dv3sugg"],
          isStartOfSession: invocationId == 0,
          message: {
            author: "user",
            inputMethod: "Keyboard",
            text: prompt,
            messageType: "Chat"
          },
          conversationSignature: conversation.conversationSignature,
          participant: {
            id: conversation.clientId
          },
          conversationId: conversation.conversationId
        }
      ],
      invocationId: String(invocationId),
      target: "chat",
      type: 4
    };
    invocationId++
    return request
  }
}

const createConversation = async () => {
  return new Promise((resolve, reject) => {
    let response = "";
    https.get(
      "https://www.bing.com/turing/conversation/create",
      { headers },
      (res) => {

        res.on("data", (chunk) => {
          response += chunk.toString("utf-8")
        })

        res.on("end", () => {
          const data = JSON.parse(response);
          if (data.result.value !== "Success") {
            reject(data);
          }
          resolve(data);
        })

      }
    ).on("error", reject);
  })
}


class ChatHub extends EventEmitter{

  constructor(conversation,mode) {
    super();
    this.conversation = conversation;
    this.request = ChatHubRequest(conversation,mode);
  }

  async ask(prompt) {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      await this.createWs();
    }
    this.send(this.request(prompt));
  }

  createWs() {
    return new Promise((resolve) => {
      this.ws = new WebSocket("wss://sydney.bing.com/sydney/ChatHub", { headers });

      this.ws.on("open", () => {
        this.send({ protocol: "json", version: 1 });
        resolve(this.ws);
      });

      this.ws.on("message", (data) => {
        const objects = data.toString("utf-8").split(DELIMITER);
        for (const obj of objects) {
          if (!obj) {
            continue;
          }
          const response = JSON.parse(obj);
          if (response["type"] === 1) {
            const text = response["arguments"][0]["messages"][0]["adaptiveCards"][0]["body"][0]["text"];
            this.emit("message", text);
          } else if (response["type"] === 2) {
            this.emit("final", response);
          }
        }
      });
      this.ws.on("close", (...args) => {
        this.emit("close", ...args);
      });
      this.ws.on("error", (...args) => {
        this.emit("error", ...args);
      });
    })
  }

  send(msg) {
    this.ws.send(appendIdentifier(msg));
  }
  close() {
    if(this.ws){
      this.ws.close();
    }
  }
}

export class ChatBot {

  constructor(mode = "h3precise"){
    this.mode = mode
  }

  async create() {
    try {
      let conversation = await createConversation();
      this.chatHub = new ChatHub(conversation,this.mode);
    } catch (error) {
      console.log("网络环境有问题，或者cookie有问题");
      throw Error
    }
  }

  async ask(prompt,handler) {
    return new Promise(async (resolve,reject) => {
      if(this.chatHub){
        this.chatHub.on("message",handler)
        this.chatHub.once("final",(res)=>{
          this.chatHub.off("message",handler)
          resolve(res["item"]["messages"][1]["adaptiveCards"][0]["body"][0]["text"])
        })
      }
      await this.chatHub.ask(prompt);

    })
  }

  async askASync(prompt) {
    return new Promise(async (resolve,reject) => {
      if(this.chatHub){
        this.chatHub.once("final",(res)=>{
          resolve(res["item"]["messages"][1]["adaptiveCards"][0]["body"][0]["text"])
        })
      }
      await this.chatHub.ask(prompt);
    })
  }

  close() {
    if (this.chatHub) {
      this.chatHub.close()
    }
  }

  async reset() {
    await this.create();
  }
}


const https = require("https");
const WebSocket = require("ws");

const headers = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41",
  "origin": "https://www.bing.com",
  "referer": "https://www.bing.com/",
  "sec-ch-ua": '"Chromium";v="110", "Not A(Brand";v="24", "Microsoft Edge";v="110"',
  "sec-ch-ua-platform": "Windows",
  "x-forwarded-for": "4.2.2.2",
  "Cookie": "_U=xxx"
};

const DELIMITER = "\x1e"

const appendIdentifier = (msg) => JSON.stringify(msg) + DELIMITER;

const ChatHubRequest = (conversation) => {
  let invocationId = 0;
  return (prompt) => {
    const request = {
      arguments: [
        {
          source: "cib",
          optionsSets: [
            "deepleo",
            "enable_debug_commands",
            "disable_emoji_spoken_text",
            "enablemm"
          ],
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


class ChatHub {

  constructor(conversation) {
    this.conversation = conversation;
    this.request = ChatHubRequest(conversation);
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
            console.log(text);
          } else if (response["type"] === 2) {
            // 结束了
            console.log("结束了");
          }
        }
      });
      this.ws.on("close", (...args) => {
        console.log("close");
      });
      this.ws.on("error", (...args) => {
        console.log("error");
      });
    })
  }

  send(msg) {
    this.ws.send(appendIdentifier(msg));
  }
  close() {
    this.ws.close();
  }
}

class ChatBot {

  async create() {
    try {
      let conversation = await createConversation();
      this.chatHub = new ChatHub(conversation);
    } catch (error) {
      console.log(error);
    }
  }

  async ask(prompt) {
    this.chatHub.ask(prompt);
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

let chatbot = new ChatBot();
await chatbot.create();
await chatbot.ask("你好");

console.log("done");


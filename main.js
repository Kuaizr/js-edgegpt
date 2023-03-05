// import { ChatBot } from "./js-edgegpt.js";

// let chatbot = new ChatBot();
// await chatbot.create();


// let index = 0
// await chatbot.ask("你好", (res) => {
//     process.stdout.write(res.substring(index));
//     index = res.length
// });
// index = 0
// process.stdout.write("\n");


import readline from "readline";

async function readAsync() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    let content = '';
    let enterCount = 0;

    rl.on('line', line => {
      content += line + '\n';
      if (line === '') {
        enterCount++;
        if (enterCount >= 2) {
          rl.close();
          resolve(content.trim());
        }
      } else {
        enterCount = 0;
      }
    });
  });
}

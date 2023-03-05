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
        if (enterCount >= 1) {
          rl.close();
          resolve(content.trim());
        }
      } else {
        enterCount = 0;
      }
    });
  });
}


import { ChatBot } from "./js-edgegpt.js";

console.log("初始化中...")
let chatbot = new ChatBot();
try {
  chatbot.create().then(async ()=>{
    console.log("加载成功")
    console.log("作者：kzer")
    console.log("特殊指令：\n\t!exit: 关闭\n\t!reset: 重开对话\n\t连续两次回车结束输入")
    console.log("\n")
  
    while(true){
      console.log("you:")
      let prompt = await readAsync()
  
      if(prompt.trim() == "!exit"){
        chatbot.close()
        process.exit()
      }else if(prompt.trim() == "!reset"){
        await chatbot.reset()
        continue
      }
      
      console.log("robot:")
      let index = 0
      await chatbot.ask(prompt, (res) => {
          process.stdout.write(res.substring(index));
          index = res.length
      });
      index = 0
      process.stdout.write("\n");
    }
  })
} catch (error) {
  process.exit()
}
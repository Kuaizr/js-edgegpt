# js-edgegpt

javascript实现的edgegpt接口，

代码参考了KeJunMao/edgegpt和acheong08/EdgeGPT这两个仓库

其实就两步，第一带上自己的cookie(_U字段)去下面这几个网站中的任意一个请求一个conversation

```
"https://www.bing.com/turing/conversation/create"
"https://cn.bing.com/turing/conversation/create"
"https://edgeservices.bing.com/edgesvc/turing/conversation/create"
```

这里我测试过了，cn.bing.com也是可以请求到的

然后带着这个conversation去和"wss://sydney.bing.com/sydney/ChatHub"建立一个websocket就可以通过websocket和edgegpt交流了。

在国内也是可以使用的，只是我没有找到模拟微软账号登录拿到cookie的方法

## 使用

把cookie.js中的cookie_U换成自己的就可以跑了

```javascript
import { ChatBot } from "./js-edgegpt.js";
let chatbot = new ChatBot(mode);
```

mode参数可选三种，对应了目前sydney的三种模式，默认是"h3precise"

"h3precise" -- 准确模式
"h3imaginative" -- 创造模式
"harmonyv3" -- 均衡模式

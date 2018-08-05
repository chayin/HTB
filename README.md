# HTB
The switching control page of our team's appliances in the HTB competition
一个物联网比赛中的家电控制页面


【前端】原生 js + 手机端轻量级的 zepto.js 框架
【后端】nodejs + express + socket.io + mongodb
![image](https://github.com/chayin/HTB/blob/master/Public/image/interface.jpg)



### 使用方法
``` bash
# 安装依赖
npm install

# 开启服务端
node server.js

# 开启mongodb

# 另开一个窗口充当设备端
node client.js

# 打开浏览器输入网页 http://127.0.0.1:8089

# 在设备端的窗口内输入（发送数据）
{"control_id": "123","user_id":"Chayin","devices": {"device_id" : "lamp1","device_type" : "lamp","device_status" : {"status": 1,"alpha" : 68}}}
```
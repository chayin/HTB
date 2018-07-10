var express = require("express"),
    bodyParser = require("body-parser"),
    path = require("path"),
    io = require("socket.io"),
    net = require('net'),
    dbase = require("./db");

var app = express(),
    urlencodedParser = bodyParser.urlencoded({extended:true}),
    Tcpserver = net.createServer(), 
    db = new dbase.MongoPersistence(); 
//聚合所有tcp设备  
var tcpSockets = [], // 用来存放socket
    tcpSocketsMsg = [], // 用来存放socket对应的数据
    clientSockets = []; // 用来存放socke.io对应的socket

app.use(bodyParser.json());
app.use(express.static("Public"));

app.get('/index.html',function(req,res) {
    res.readFile(__dirname + "/" + "index.html");    
});

var server = app.listen(8089,'localhost',function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("应用实例，访问地址为 http://%s:%s",host,port);
});  
server.setMaxListeners(30);

Tcpserver.listen(54321,'localhost',function() {
    var host = Tcpserver.address().address;
    var port = Tcpserver.address().port;

    console.log("应用实例，访问地址为 http://%s:%s",host,port);
});

//接受新的客户端连接  
Tcpserver.on('connection', function(socket){  
    console.log('got a new connection'); 

    //从连接中读取数据  
    socket.on('data', function(data){  
        console.log('got devices data:', data); 
        // console.log(Buffer.from(data));
        try{
            data = JSON.parse(Buffer.from(data));  // 将二进制流转化为json
            console.log(data);
        }catch(err) {
            console.log(err);
            data = JSON.parse(JSON.stringify(Buffer.from(data)));
            console.log(data);
        }
        
        console.log("data.id:" + data.control_id);

        var id = data.control_id;
        var user = data.user_id;

        // 设备关闭错误时
        socket.on('error', function(err){  
            console.log("tcp error");  
            console.log(err); 
            var index = tcpSockets.indexOf(socket);
            if(index >= 0) {  
               tcpSockets[id] = "";  // 错误：id为定义
               tcpSocketsMsg[id] = ""; 
            }
            // console.log(tcpSockets)
        }); 

        tcpSockets[id] = socket;
        tcpSocketsMsg[id] = data;
        db.find({"control_id": id, "user_id": user}, function(result) {
            if(result.length === 0) { // 新设备
                console.log("搜索数据空，新中控");
                if(clientSockets[user]) {
                    // console.log(tcpSocketsMsg[id])
                    clientSockets[user].emit("addDevice",data.devices.device_id);
                }else{ // 客户端没在线
                    console.log('NoclientSockets[user]');
                }
                var arr = [];
                arr[0] = data.devices;
                data.devices = arr;
                // var query = {$set: data};
                db.update({"user_id": user},{$set: data});

            }else { // 旧中控
                var devices = result[0].devices;
                var flag = 0;
                for (var i = 0, len = devices.length; i < len; i++) { // 旧设备
                    if(devices[i].device_id === data.devices.device_id) {
                        var findStr = {"devices": {"$elemMatch":{"device_id": data.devices.device_id}}};
                        var updateStr = {$set: {"devices.$.device_status" : data.devices.device_status}};
                        // db.updateDevices(findStr,sendStr.updateStr);
                        db.update(findStr, updateStr);
                        if(clientSockets[user]) {
                            try {
                                // console.log("clientSockets[user]")
                                clientSockets[user].emit('setdevicestatus',tcpSocketsMsg[id]);
                            }catch(err) {
                                console.log(err);
                            }
                            
                        }else{ // 客户端没在线
                            console.log('NoclientSockets[user]');
                        }
                        flag = 1;
                        break;
                    }
                }
                if(flag === 0) {  //新设备
                    db.addDevices(data);
                    // console.log(tcpSocketsMsg[id])
                    try {
                        clientSockets[user].emit("addDevice",data.devices.device_id);
                    }catch(err) {
                        console.log(err);
                    }
                }

            }
        });


        //删除被关闭的连接  
        socket.on('close', function(){  
            console.log('tcp connection closed'); 
            tcpSockets[id] = "";
            tcpSocketsMsg[id] = "";
        });  
    });  
});  
  
Tcpserver.on('error', function(err){  
    console.log('TcpServer error:', err.message);  
});  
  
Tcpserver.on('close', function(){  
    console.log('TcpServer closed');  
});  

Tcpserver.setMaxListeners(30);
var sio = io.listen(server);
sio.on('connection',function(socket){
    var user = "";

    // console.log("socket.id :" + socket.id)
    // console.log("tcpSocketsMsg:")
    // 客户端新连接的时候，要渲染页面renderPage 和渲染菜单栏renderMenu
    socket.on("newconnect", function(data) { 
        // console.log("newconnect:" + data)
        clientSockets[data] = socket;
        user = data;
        db.find({user_id: data}, function (result) {
            if(result.length === 0) {
                console.log("没有该用户,添加该用户");
                db.insert({user_id: data});
            }else {
                socket.emit("renderPage",result[0]);
                if (result[0].rooms) {
                    if(result[0].rooms.length !== 0) {
                        socket.emit("renderMenu",result[0].rooms);
                    }else {
                        console.log("用户还没设置房间");
                    }
                }  
            }
        });
    });

    // 发送新设备数据
    socket.on("getnewdevice", function(data) {
        // console.log(data)
        db.findOrder({query : data.device_id, order : "device_id"}, function(result) {
            if(result.length === 0) {
                console.log("没找该新设备信息，请重启设备接入");
                socket.emit("err", "没找该新设备信息，可能数据在传输中丢失，请重启设备接入");
            }else{
                console.log("找到啦");
                socket.emit("setnewdevice", {control_id: result[0].control_id, devices: result[0].devices[0]});
            }
        });
        var findStr = {"devices": {"$elemMatch":{"device_id": data.device_id}}};
        var updateStr = {$set: {"devices.$.device_room":data.device_room}};
        db.update(findStr, updateStr);
    });
    
    // 房间页面渲染请求
    socket.on("getroompage", function(data) {
        // console.log("getroompage"+data.device_room);
        db.findOrder({query : data.device_room, order : "device_room"}, function(result) {
            if(result.length === 0) {
                console.log("没有该房间的设备");
            }else {
                console.log(result[0]);
                socket.emit("renderPage",result[0]);
            }
        });
    });
    // 设备更新
    socket.on("setstatus", function(data) {
        if(tcpSockets[data.control_id]) {
            try {
                // 更新数据库
                var findStr = {"devices": {"$elemMatch":{"device_id": data.devices.device_id}}};
                var updateStr = {$set: {"devices.$.device_status" : data.devices.device_status}};
                db.update(findStr, updateStr);
                // 同时发送更新信息给设备
                tcpSockets[data.control_id].write(JSON.stringify(data));
            }catch(err) {
                console.log(err);
            }
            
        }else{
            console.log("设备不在线");
            socket.emit("err", "无法连接设备，请确保设备已开启");
        }
        
    });
    
    socket.on("setrooms",function(data){
        db.update({"user_id": data.user_id},{$set: {rooms:data.rooms}});
    });

    socket.on('disconnect', function(){
        console.log('client connection is disconnect!');
        clientSockets[user] = '';
    });

// {"control_id": "123","user_id":"Chayin","devices": {"device_id" : "lamp1","device_type" : "lamp","device_status" : {"status": 1,"alpha" : 88}}}

});

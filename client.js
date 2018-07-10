var net = require('net');  
var port = 54321;  
var quitting = false;  
var conn;  
var retryTimeout = 3000;    //三秒，定义三秒后重新连接  
var retriedTimes = 0;   //记录重新连接的次数  
var maxRetries = 10;    //最多重新连接十次  

process.stdin.resume(); //process.stdin流来接受用户的键盘输入，这个可读流初始化时处于暂停状态，调用流上的resume()方法来恢复流  
  
process.stdin.on('data', function(data){  
    if (data.toString().trim().toLowerCase() === 'quit'){  
        quitting = true;  
        console.log('quitting');  
        conn.end();  
        process.stdin.pause();  
    } else {  
        conn.write(data);  
    }  
});  
  
//连接时设置最多连接十次，并且开启定时器三秒后再连接  
(function connect() {  
    function reconnect() {  
        if (retriedTimes >= maxRetries) {  
            throw new Error('Max retries have been exceeded, I give up.');  
        }  
        retriedTimes +=1;  
        setTimeout(connect, retryTimeout);  
    }  
  
    conn = net.createConnection(port);  
  
    conn.on('connect', function() {  
        retriedTimes = 0;  
        console.log('connect to server');  
    });  
  
    conn.on('error', function(err) {  
        console.log('Error in connection:', err);  
    });  
  
    conn.on('close', function() {  
        if(! quitting) {  
            console.log('connection got closed, will try to reconnect');  
            reconnect();  
        }  
    });  
  
    //打印  
    conn.pipe(process.stdout, {end: false});  
})();  
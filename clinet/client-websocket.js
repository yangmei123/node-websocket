function WebSocketTest() {
  if ("WebSocket" in window) {
    // 打开一个websocket
    var ws = new WebSocket("ws://127.0.0.1:1339");
    ws.onopen = function() {
    // WebSocket连接成功，使用 send() 方法来发送数据
    ws.send("我是要发送的数据~");
      console.log("数据发送中...");
    };

    ws.onmessage = function(msg) {
      // 监听服务端发送数据
      var receiveMsg = msg.data;
      console.log("数据已接收...");
    };

    ws.onclose = function() {
      // 关闭 websocket
      console.log("连接已关闭...");
    };
  } else {
    // 浏览器不支持 WebSocket
    console.log("您的浏览器不支持 WebSocket!");
  }
  console.log(window);
}

var webBtn = document.getElementById('getWebSocket');
webBtn.onclick = function () {
  console.log('调用webSocket方法');
  WebSocketTest();
}

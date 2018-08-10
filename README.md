# node-websocket

> 使用node 构建websocket服务

> 在解析websocket的那部分代码不是我写的，是参考网上资源，自己做了理解拿来用的~

> 虽然网上有很多封装好的ws包，但是还是想自己理解下

### 运行流程

> 启动 node服务

> npm 进入项目，运行$ node nodejs-socket.js 启动成功会看到服务开启

![Image text](https://github.com/yangmei123/vue-slider/blob/master/node.png)

> 双击client-webSocket.html 在浏览器点击webSocket按钮就可以看到发送和接收到消息了~

![Image text](https://github.com/yangmei123/vue-slider/blob/master/demo.gif)

> 将clinet文件夹里的client-websocket

### 解码的过程

收到一个16进制的数据帧：

<Buffer 81 99 a2 91 c5 7b 44 19 54 9d 3a 3e 2d dd 23 74 4a ea 4b 11 44 9c 38 15 23 ee 12 77 48 d5 dc>

转为二进制

10000001 10011001 ...

根据官方给的一个结构图：
 81               99              a2
 0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+

将第一个字节转换为10进制为：129

转为2进制为：10000001

则FIN为第一位等于1，

RSV1,RSV2,RSV3各占一位，都为0，

OPCODE:4位 表示接收类型，1表示文本

将第二个字节转换为10进制为： 153

转为2进制为：10011001

MASK:1位，用于标识PayloadData是否使用掩码，客户端发出的数据帧都需要进行掩码，该位等于1。所以数据需要解码。

payload length (PayloadData)的长度(后面7位)： （计算后为25）

如果值在0-125，则是payload的真实长度。

如果值是126，则后面2个字节形成的16位无符号整型数的值是payload的真实长度。

如果值是127，则后面8个字节形成的64位无符号整型数的值是payload的真实长度。

MaskingKey，占四个字节，储存掩码的实体部分；只有在MASK被设置为1时候才存在这个数据，所以服务器端向客户端发送消息就没有。

所以3到6字节的"a2 91 c5 7b"是数据的掩码实体。 

最后是数据部分，如果掩码存在，则所有数据都需要与掩码做一次异或运算。如果不存在掩码，那么后面的数据就可以直接使用。

直接取掩码实体转化为缓冲区来使用.

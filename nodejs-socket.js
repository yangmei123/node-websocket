const http = require('http');
const crypto = require('crypto');
const iconv = require('iconv-lite');

// 创建一个 HTTP 服务器
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
});
//《深入浅出nodejs》 p163 里关于websocket服务
// 前端发起请求，与Http请求不同的是以下协议头：

// Upgrade: websocket
// Connection: Upgrade
// 表示请求服务端升级协议为WebSocket
// 其中Sec-WebSocket-Key是随机生成的Base6编码字符串。

// 在收到upgrade请求后，告知客户端允许切换协议
server.on('upgrade', (req, socket, head) => {
    // 使用nodejs的 crypto加密解密模块
    // 服务器接收到后将其与字符串2258EAFA5-E914-47DA-95CA-C5AB0DC85B11相连
    // 通过sha1安全散列算法基三出结果，再进行base64编码，最后返回给客户端
    const val = crypto.createHash('sha1')
        .update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
        .digest('base64');
    const frame = {
        buffer: new Buffer(0),
    };
    // 让数据立即发送
    socket.setNoDelay(true);
    // 服务端处理完请求，响应报文
    // 客户端验证Sec-WebSocket-Accept的值，成功就开始数据传输
    socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
        'Upgrade: WebSocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept:' + val + '\r\n' +
        '\r\n');
    // 监听接收到的数据，给客户端发送数据
    // 这里注意WebSocket数据帧的定义，一个字节 8位, 客户端在编码后发给服务端
    // 接收到的数据是流模式，TCP流要进行处理
    // 接收到这些编码数据，解析为相应的数据帧，
    // 再以数据帧的格式，通过掩码将正真的数据解密出来，发送给客户端
    socket.on('data', sendRecive.bind(null, socket, frame));
    // 解码
    function decodeDataFrame(e) {
        // 解密算法
        var i = 0,
            j, s, arrs = [];
        var frame = {
            // 解析前两个字节的基本数据
            FIN: e[i] >> 7, // 右移7位等于1 e[0]转为二进制再右移
            Opcode: e[i++] & 15, //Opcode占第一个字节二进制后4位，和1111做与比较
            Mask: e[i] >> 7, // e[1]二进制第一位
            PayloadLength: e[i++] & 0x7F // e[1]二进制的后7位和(1111111) 做与运算
        };

        // 处理特殊长度126和127
        if (frame.PayloadLength === 126) {
            frame.PayloadLength = (e[i++] << 8) + e[i++];
        }
        if (frame.PayloadLength === 127) {
            i += 4; // 长度一般用4个字节的整型，前四个字节一般为长整型留空的。
            frame.PayloadLength = (e[i++] << 24) + (e[i++] << 16) + (e[i++] << 8) + e[i++];
        }
        // 判断是否使用掩码
        if (frame.Mask) {
            // 获取掩码实体 站4个字节
            frame.MaskingKey = [e[i++], e[i++], e[i++], e[i++]];
            // 对数据和掩码做异或运算
            for (j = 0, arrs = []; j < frame.PayloadLength; j++) {
                arrs.push(e[i + j] ^ frame.MaskingKey[j % 4]);
            }
        } else {
            // 否则的话 直接使用数据
            arrs = e.slice(i, i + frame.PayloadLength);
        }
        // 数组转换成缓冲区来使用
        arrs = new Buffer(arrs);
        // 如果有必要则把缓冲区转换成字符串来使用
        if (frame.Opcode === 1) { // 是文本格式的
            arrs = arrs.toString();
        }
        // 设置上数据部分
        frame.PayloadData = arrs;
        // 返回数据帧
        return frame;
    }
    // 编码算法
    // 将解析到的数据
    // 发送给客户端
    function encodeDataFrame(e) {
        // 获取第一位
        let bufferArr = [];
        let i = 0;
        let PayloadData = Buffer.from(e.PayloadData); // 放到buffer
        const PayloadLength = PayloadData.length;
        const fin = e.FIN << 7; // 转为2进制
        bufferArr.push(fin + e.Opcode); // 第一个字节拼好
        // 不是特殊长度直接使用 不用掩码
        if (PayloadLength < 126) bufferArr.push(PayloadLength);
        else if (PayloadLength < 0x10000) bufferArr.push(126, (PayloadLength & 0xFF00) >> 8, PayloadLength & 0xFF);
        else bufferArr.push(
            127, 0, 0, 0, 0, //8字节数据，前4字节一般没用留空
            (PayloadLength & 0xFF000000) >> 24,
            (PayloadLength & 0xFF0000) >> 16,
            (PayloadLength & 0xFF00) >> 8,
            PayloadLength & 0xFF
        );
        //返回头部分和数据部分的合并缓冲区
        return Buffer.concat([new Buffer(bufferArr), PayloadData]);
    };

    function sendRecive(socket, frame, data) {
        // console.log(decodeDataFrame(data));
        console.log(data); // buffer对象16进制数据
        // 之前想的太简单，不用编码直接把获取到的buffer传回去就行了
        // 但是是有问题的，服务端传给客户端的数据不需要掩码mask为0就行了
        // 所以还是需要编译
        const readableData = decodeDataFrame(data).PayloadData;
        console.log(encodeDataFrame({
            FIN: 1,
            Opcode: 1,
            MASK: 0,
            PayloadData: '我是不需要掩码的数据~'
        }));
        socket.write(encodeDataFrame({
            FIN: 1,
            Opcode: 1,
            MASK: 0,
            PayloadData: '我是不需要掩码的数据~'
        }));
    }
});
// 服务器正在运行
server.listen(1339, 'localhost', (res) => {
    console.log('服务开启');
});
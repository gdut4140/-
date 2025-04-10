const express = require('express');
const multer = require('multer');
const cors = require('cors'); // 引入 cors 中间件
const app = express();
const port = 3000;

// 配置 multer 用于处理文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 解析 JSON 数据
app.use(express.json());

// 使用 cors 中间件
app.use(cors());

// 处理根路径的 GET 请求
app.get('/', (req, res) => {
    res.send('欢迎访问服务器！');
});

// 处理 POST 请求
app.post('/api', (req, res) => {
    const { image, content, modelList } = req.body;
    console.log('接收到的数据:', { image, content, modelList });

    res.status(200).json({ message: '你好世界' });
});

// 处理项目上传请求
app.post('/api/project', upload.single('image'), (req, res) => {
    const { projectName, projectDescription, server } = req.body;
    const image = req.file;

    console.log('接收到的项目数据:', { projectName, projectDescription, server, image });

    res.status(200).json({ message: '你好世界' });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
//终端输入：
// npm init - y
// npm install express multer
// npm install cors
// node server.js

## Getting Started

在 [openRouter](https://openrouter.ai/) 申请 API_KEY

安装依赖：

```shell
npm install -g pnpm
pnpm i
```

启动开发环境：

```shell
pnpm dev
```

浏览器打开：[http://localhost:3000](http://localhost:3000)

点击头像，输入 API_KEY，点击设置，成功后即可进行对话

如需改变请求地址，修改 `.env` 文件中的 `NEXT_PUBLIC_BASE_URL`
如需改变模型，修改 `.env` 文件中的 `NEXT_PUBLIC_MODEL_NAME`

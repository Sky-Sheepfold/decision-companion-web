# 前端启动说明

## 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

## 安装依赖

```bash
cd frontend
npm install
```

## 配置环境变量

复制环境变量配置文件：

```bash
cp .env.example .env
```

根据需要修改 `.env` 文件中的 `VITE_API_BASE_URL`。

## 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 构建生产版本

```bash
npm run build
```

## 路由说明

- `/onboarding` - 冷启动引导页（首次使用）
- `/chat` - 对话主界面
- `/profile` - 档案可视化页面

## 功能说明

### 冷启动引导 (/onboarding)

新用户首次使用时会进入破冰对话，通过5个问题建立初始画像。

### 对话界面 (/chat)

- 支持流式对话（SSE）
- 自动保存会话ID到 sessionStorage
- 显示消息时间戳
- 支持 Enter 发送消息

### 档案可视化 (/profile)

展示用户的五类档案：

1. **价值观档案** - 用户真正在意的东西
2. **决策历史** - 做过的重大选择
3. **情绪模式** - 在什么情境下的情绪反应
4. **关系图谱** - 生命中重要的人
5. **恐惧与边界** - 深层恐惧和心理红线

## 技术栈

- React 19
- TypeScript
- React Router v7
- Vite
- CSS3 (无UI框架，纯手写样式)

## 设计特点

- 温暖、有个性的界面设计
- 响应式布局
- 流畅的动画效果
- 中文优先（Noto Serif SC + Noto Sans SC）

## License

MIT

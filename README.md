# 静心阁 - 极简冥想资源网站

一个极简、素雅、白底黑字的冥想资源平台，完全复刻 Sahaja Live 原版风格。

## 特性

- **极简设计** — 白底黑字，零动画，零花哨装饰
- **极速访问** — 纯静态HTML，国内访问快速
- **响应式** — 手机、平板、电脑自适应
- **隐私保护** — 无需登录，数据存储在浏览器本地
- **抗下架** — 支持 IPFS 部署，去中心化存储

## 快速开始

### 本地运行

1. 下载或克隆项目到本地
2. 直接用浏览器打开 `index.html` 即可使用

```bash
# 或使用简单的 HTTP 服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 部署到 GitHub Pages

1. 创建 GitHub 仓库
2. 将所有文件上传到仓库的 `main` 分支
3. 进入仓库 Settings → Pages
4. Source 选择 `main` 分支，保存
5. 等待部署完成，访问 `https://你的用户名.github.io/仓库名`

### 部署到 IPFS（抗下架）

#### 方案一：使用 Fleek（推荐）

1. 将代码推送到 GitHub
2. 注册 [Fleek](https://fleek.co/)
3. 连接 GitHub 仓库
4. Fleek 会自动构建并部署到 IPFS
5. 获得 IPFS 链接和自定义域名

#### 方案二：使用 Pinata

1. 安装 IPFS Desktop 或 IPFS CLI
2. 将项目文件夹添加到 IPFS
3. 使用 Pinata 固定（Pinning）你的 CID
4. 通过网关访问：`https://ipfs.io/ipfs/你的CID`

#### 方案三：使用 Web3.Storage

1. 注册 [Web3.Storage](https://web3.storage/)
2. 上传整个项目文件夹
3. 获取 IPFS CID
4. 通过网关访问

### 国内部署

如果主要面向国内用户，可以部署到：

- 阿里云 OSS（静态网站托管）
- 腾讯云 COS（静态网站托管）
- 七牛云 Kodo
- 码云 Gitee Pages（需实名认证）

## 文件结构

```
冥想网站/
├── index.html          # 首页
├── lectures.html       # 讲座开示列表
├── videos.html         # 视频专区列表
├── literature.html     # 经典文献列表
├── activities.html     # 各地活动列表
├── downloads.html      # 下载资料列表
├── detail.html         # 详情页
├── about.html          # 关于本站
├── admin.html          # 后台管理
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── data.js         # 数据管理
│   ├── main.js         # 公共脚本
│   └── admin.js        # 后台脚本
└── README.md           # 本文件
```

## 使用说明

### 内容管理

1. 点击导航栏的"后台管理"进入管理页面
2. 选择要发布的板块，填写标题、内容等
3. 支持在内容区直接粘贴图片（自动转为 base64）
4. 点击"发布内容"即可添加新内容

### 评论功能

- 详情页底部可发表评论
- 评论存储在浏览器本地 localStorage
- 刷新页面后评论仍会保留

### 暗黑模式

- 点击右上角的"暗黑模式"按钮切换
- 主题偏好会保存在本地

### 数据备份

所有数据存储在浏览器 localStorage 中。如需备份：

1. 打开浏览器开发者工具（F12）
2. 在 Console 中执行：
```javascript
JSON.stringify(localStorage)
```
3. 复制输出内容保存

### 恢复数据

1. 在后台管理页面打开 Console
2. 执行：
```javascript
localStorage.setItem('site_lectures', '你的备份数据');
```
（替换为对应的存储键和数据）

### 重置数据

如需恢复默认示例内容，在 Console 中执行：

```javascript
resetToDefaults()
```

## 自定义

### 修改网站名称

编辑各 HTML 文件中的 `SAHAJA LIVE` 和 `静心阁`

### 修改颜色

编辑 `css/style.css` 中的 CSS 变量：

```css
:root {
  --bg-color: #FFFFFF;
  --text-color: #333333;
  --link-color: #1a73e8;
  /* ... */
}
```

### 修改横幅渐变

```css
.hero-banner {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF8C42 100%);
}
```

## 技术栈

- HTML5
- CSS3（原生，无框架）
- JavaScript（原生 ES6+，无框架）
- localStorage 数据存储

## 浏览器兼容

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- 移动端浏览器

## License

MIT License - 可自由使用、修改和分发

---

愿每一个人都能在宁静中找到内心的平和。

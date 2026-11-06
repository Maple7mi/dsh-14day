# 14 天学会 DeepSeek Harness · 在线手册

写给高中毕业生的 DeepSeek Harness 零基础学习计划，网页版。

- 首页：`index.html` —— 14 天路线、三个核心问题、下载
- 完整手册：`guide.html` —— 14 天逐日任务 + 附录 A–I，含站内搜索
- 下载：`downloads/` —— PDF（67 页）、Word、Markdown 源文件

## 本地打开

直接双击 `index.html` 即可；或在本目录运行：

```powershell
python -m http.server 8321
```

然后访问 http://127.0.0.1:8321/ 。

## 部署

纯静态站点，无构建依赖、无外部 CDN，可直接部署到 GitHub Pages：
把仓库根目录设为发布源（branch `main` / root）即可。

内容基于 DSH 桌面版 0.2.1-rc.5（2026 年 11 月）的官方文档与配置整理；
界面文案可能随版本变化，以实际看到的为准。

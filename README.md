# 向善造物 · 蓝海课堂

基于 Astron 与 SparkLLM 的 3D 公益课堂共创助手。首个体验为海洋环保：3D 小岛探索 → 收集四件海漂 → 垃圾分类 → 三题知识挑战 → 海洋守护证书。

[体验中文课堂](https://goodaction-ocean-classroom.vercel.app/) · [English classroom](https://goodaction-ocean-classroom.vercel.app/en/)

2026-11-25，Astron 和 Spark 两个入口均已在 Vercel 生产环境完成生成、三题审阅、应用、答题与领取证书的实测。

## 当前版本的真实状态

- 已实现：程序化低多边形 3D 场景、可旋转缩放视角、点击物体、完整学习流程、错误解释与重试、学习进度本机保存、昵称证书打印、JSON 课程/学习记录导出。
- 已实现：创作者工作台、服务状态、Spark / Astron 服务端调用适配、Aholo Lux3D 文生 3D 创建/轮询/下载、GLB 导入及 IndexedDB 本机持久化。
- v0.3：Spark-X2.6-4B 运行凭据已配置于站点服务端，实际外部调用已返回结构化课程。生产使用同一份 Worker 适配代码，使用 create_lesson 函数调用；无效结构最多重试一次，不使用内置内容伪造成功。2026-11-06 08:56 UTC 本地运行该适配代码实际返回 HTTP 200。
- Astron 已改用个人 OpenAI HTTP 模型“蓝海课堂 Spark4B HTTP”（spark-x2.6-4b）。平台完整调试 67.039 秒成功；2026-11-06 09:46 UTC 发布 API 真实返回 HTTP 200 / code 0，三题课程通过网站同一校验器。请求允许等待 180 秒。详见 docs/ASTRON_WORKFLOW.md。
- Aholo 在线生成 API 仍未配置；真实海龟素材已经接入。单元测试中的外部接口均明确使用 mock，与真实验证分开记录。
- v0.2 已接入用户从 Aholo Lux3D 图生 3D 导出的真实海龟，并固化到发布版本；其他岛屿场景为程序化模型。原始 GLB 为 13,175,060 字节、283,682 个三角面；带贴图网页版为 788,948 字节、17,020 面，兼容版为 401,972 字节、7,160 面。来源及 SHA-256 记录见 assets/turtle.provenance.json。尚未取得任务编号与生成时间，不作推测。
- 生成课程当前只更新课程名、目标、开场白和三道问答。场景与分类机制使用固定的海洋模板；不是任意一句话生成任意游戏。

## 运行

```bash
npm ci
npm run build
npm run dev -- --port 3000
npm test
npm run validate
```

Node.js 22+。应用前端与 Three.js 一起打包到 Worker，页面不依赖外部 CDN。无 WebGL 时使用 SVGRenderer 投影同一个 3D 场景；轻量模式不支持 PBR 贴图/阴影，复杂 GLB 推荐使用 WebGL 浏览器。

本地开发端口支持 --port。Sites 版本依赖平台提供的可信身份；Vercel 版本按用户要求公开，服务端由可信客户端 IP 派生每日限频标识，不接受外部伪造的 OAI 身份头。

## 服务端配置

参见 `.env.example`（仅键名；无真实凭据）。生产值设置到 Sites 的运行时环境变量，不放在前端、Git 或报告中。

- Astron：完整发布服务 URL、Flow ID、应用 Key/Secret；本流程 Start 输入为 `AGENT_USER_INPUT`，通过 ASTRON_INPUT_NAME 配置。按 docs/ASTRON_WORKFLOW.md 配置真实流程。
- Spark：已部署的 OpenAI 兼容基地址（当前 MaaS 为 `/v2`）、模型名；如果服务有鉴权，提供 Key。Hugging Face 模型主页不是推理 API。
- Aholo：CN API Key，Authorization 使用原始 Key。固定生成低多边形海龟，输出 GLB，面数 30000。

外部模型按应用约束输出严格课程 JSON。服务未连接或上游失败时明确报错，不把内置课程说成实时 AI 输出。

## 素材与证据

Aholo 成功任务模型由后端即时下载，前端以二进制 GLB 存入 IndexedDB；不依赖两小时后过期的下载地址。保留任务编号、生成时间和提示词；导出课程 JSON 可获取来源记录。手动导入的来源声明不自动标为验证成功。

发布版海龟已经随 Worker 打包，所有有权访问网站的访客均可加载，无需先在作者浏览器导入。后续手动导入的其他素材仍仅保存在当前浏览器；“恢复发布版海龟”可清除本机覆盖并恢复发布素材。完整贴图模型用于 WebGL；无 WebGL 时加载由同一模型生成的顶点色轻量版。

重新优化：node scripts/optimize-turtle.mjs /absolute/path/to/original.glb。原始用户文件保留于上传附件，不覆盖原件。

## 隐私与无障碍

默认无需学生账号、姓名或联系方式。昵称与学习进度仅存于本机。提供按钮式任务入口、高对比度、减少动画、键盘焦点提示。点击“生成课程方案”会把输入教学需求提交到已配置服务；不要输入学生个人信息。

## 检查

15 项测试覆盖发布素材的 GLB 完整性、哈希与来源记录、兼容版顶点数据，以及未连接状态、跨域/身份保护、课程 JSON 验证、三家接口适配（mock）、课程 JSON 语法恢复后的严格校验，以及 Astron 无效结果的有界重试。已在浏览器实际完成完整内置学习流程，包含错误选择、重试和证书。WebGL 在测试云浏览器被禁用，使用轻量 3D 路径验证；真实 Aholo 海龟已在轻量路径完成浏览器验证；Spark 真实服务端生成已验证，Spark 线上页面已真实生成三题课程；Astron 平台完整调试和发布 API 均真实成功，接口返回课程通过严格校验。网页实时服务状态仅在实际调用成功后显示。

## 官方接口资料

- https://github.com/iflytek/astron-agent/blob/main/docs/guide/integration.md
- https://huggingface.co/XHToken/Spark-X2.6-4B
- https://labs.aholo3d.cn/api-docs/openapi.json
- https://github.com/manycoretech/aholo-spatial-sdk

第三方：Three.js（MIT，见 THIRD_PARTY_NOTICES.txt）。自编代码采用 Apache-2.0。

## 中英双语与 Vercel

中文 `/`、英文 `/en/`；导航可切换语言。两种语言分别保存学习进度，导入的 GLB 素材共用本机存储。英文界面的课程生成会要求模型使用英文，JSON 字段名保持一致。

Vercel：`npm run build:vercel` 输出公开静态课堂与本地 3D 资产；`api/handler.js` 在 Node.js 服务端调用相同 Worker 适配逻辑。配置 Astron/Spark 运行环境变量及随机 PUBLIC_RATE_LIMIT_SALT。全部课堂与课程共创均按用户要求公开。身份桶由可信 x-forwarded-for 生成每日不可逆标识，丢弃客户端伪造的 OAI 身份；原有同源校验、输入长度及每 IP 每实例限频仍生效。该内存限频不构成跨实例总额度上限，生产额度由模型服务账户控制。密钥不进入浏览器或源码。

`npm run build` 继续生成 Sites Worker 版本，保留原有托管配置。

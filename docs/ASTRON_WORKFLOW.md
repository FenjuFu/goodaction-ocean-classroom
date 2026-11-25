# 蓝海课堂 · Astron 真实课程生成

工作流：蓝海课堂 · 公益课程共创
Start 输入：AGENT_USER_INPUT → LLM input → End output，结束回答内容 {{output}}。
凭据只在平台与站点服务端保存，不写入源码、报告或前端。

## 2026-11-06 已验证结果

- Spark 直连：MaaS v2 / spark-x2.6-4b；create_lesson 函数调用，enable_thinking=false；网站真实生成《海龟守护海洋减塑课堂》，包含三题，页面显示调用成功。
- Astron：新建并启用个人 OpenAI 模型“蓝海课堂 Spark4B HTTP”，复用用户已授权的有效 Spark Key。服务 base_url 为 https://maas-api.cn-huabei-1.xf-yun.com/v2，平台保存为完整 /chat/completions 地址，model 为 spark-x2.6-4b。
- 工作流已切换到新 HTTP 模型，temperature=0.2，max_tokens=8192。平台完整调试成功，耗时 67.039 秒，返回三题课程。
- 更新 API 配置后，2026-11-06 09:46 UTC 真实外部调用返回 HTTP 200、code=0、message=Success。使用网站同一 parsePlan 校验器验证《小蓝的无塑海湾》成功：三题、每题三个选项，正确答案索引均有效。
- 网页对 Astron 的请求等待上限为 180 秒，并提示可能需要约两分钟；不伪造成功，不使用内置课程冒充 AI 输出。页面服务状态在本次调用成功后更新。对完整但含逗号/引号等语法错误的 JSON 进行本地修复后，仍严格校验课程结构；不补写缺失题目、不修改答案索引。无法通过时最多重新请求一次，在剩余等待预算不足时直接报错。
- 网站保留原有 owner-only 访问范围。没有购买套餐或扩大分享范围。

## 已定位的兼容限制

旧的托管个人模型调试出现 WebSocket connection exception，内置 Spark X2 发布版本出现 20373。新建 OpenAI HTTP 模型后，真实工作流 API 已成功，不再沿用上述失败配置。

当前托管 Astron 后端将自定义模型参数直接传给 OpenAI SDK。enable_thinking 不是标准 SDK 参数，直接配置会报 unexpected keyword argument；官方要求放入 extra_body。模型管理界面不能提供该对象配置，因此此流程只配置标准 temperature 与 max_tokens，保留推理模式并等待完整正文。不要把 enable_thinking 作为顶层自定义参数重新加入。Spark 直连仍可通过原生 HTTP 正确关闭思考。

## 维护与回归

1. 保持输入名称、Flow ID、应用绑定及模型名一致。变更后先调试，再更新 API 配置。
2. 校验输出严格 JSON：title、objective、intro、quiz；quiz 恰好三题，每题三至四个选项，answer 是从零开始的有效索引。
3. 从网页“课堂共创”分别选择 Astron 与 Spark，生成并应用，再导出当前课程；以真实服务返回及实际界面为证据。
4. Aholo 在线 API 仍未配置；已接入的是用户从 Lux3D 导出的真实海龟 GLB，不宣称在线生成 API 已打通。

官方文档：
- https://www.xfyun.cn/doc/spark/Agent03-%E5%BC%80%E5%8F%91%E6%8C%87%E5%8D%97.html
- https://maas.xfyun.cn/doc/
- https://www.xfyun.cn/doc/spark/%E6%8E%A8%E7%90%86%E6%9C%8D%E5%8A%A1-http.html

# DeviceCare Agent

面向智能硬件售后的 AI 诊断辅助系统。它帮助客服在一次会话中完成信息收集、故障判断、工具查询、回复生成和人工交接。

项目先通过客服桌面工作台验证诊断闭环；核心能力稳定后，再提供可自托管的官网客服 Widget，让企业配置服务端模型密钥后，用一段脚本把受限的自助诊断入口嵌入官网。

当前阶段是方案与架构准备，尚未开始业务代码开发。

## MVP

首版聚焦一个产品品类和三类高频故障，验证“客服是否能更快、更稳定地完成诊断”。

| 范围 | 首版内容 |
|---|---|
| 使用者 | 一线客服、售后技术支持 |
| 入口 | 首版为桌面端 Web 工作台；后续增加官网嵌入 Widget |
| 核心流程 | 收集信息 → 检索知识 → 生成诊断 → 查询工具 → 回复或转人工 |
| 必备工具 | 设备信息、保修状态、库存、维修进度 |
| 安全边界 | 低置信度和高风险场景转人工；系统事实不得猜测 |

完整产品范围见 [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md)。

## 技术方向

首版采用 Node.js 24 LTS、Next.js 和 PostgreSQL，先做一个可部署的模块化单体。前端页面、服务端路由和领域逻辑放在同一应用中，等真实复杂度出现后再拆分。

LangChain 不是默认依赖或产品定位。诊断状态、安全规则和工具边界先用显式 TypeScript 代码实现；只有模型适配或检索编排出现真实复杂度时，才评估引入 LangChain.js。

详细模块、数据和拆分条件见 [docs/architecture.md](./docs/architecture.md)。

## 计划中的开源交付形态

诊断闭环通过评估后，项目计划提供 Docker Compose、自带示例知识与服务端配置说明。企业完成部署后，可以通过类似下面的一行代码接入官网：

```html
<script async src="https://support.example.com/devicecare-widget.js"></script>
```

这里的“一行代码”只代表网页嵌入步骤，不代表企业知识清洗、风险规则、模型密钥和人工接管可以免配置。Widget 只展示可面向用户的内容，不暴露内部诊断说明或密钥。

## 仓库结构

```text
DeviceCareAgent/
├─ AGENTS.md              # 稳定的协作与开发规则
├─ HANDOFF.md             # 当前状态和下一步
├─ PROJECT_PROPOSAL.md    # 产品方案唯一权威
├─ README.md              # 项目入口
├─ docs/
│  ├─ architecture.md     # 技术方案唯一权威
│  └─ development-workflow.md # 多 Agent 开发协作流程
└─ AGENT_LESSONS.md       # 可复用失败教训
```

代码目录会在 MVP 范围确认后创建，避免提前生成空脚手架。

## 阅读顺序

- 想了解项目：读本页。
- 想确认做什么、如何验收：读 `PROJECT_PROPOSAL.md`。
- 想开发或评审技术方案：读 `docs/architecture.md`。
- 想使用多 Agent 开发：读 `docs/development-workflow.md`。
- 想接手当前任务：读 `AGENTS.md` 和 `HANDOFF.md`。

## 近期里程碑

1. 确认首个设备品类和三类故障。
2. 建立最小知识库、诊断状态和四个工具的模拟接口。
3. 完成一条端到端客服工作台流程。
4. 用固定案例集评估答案质量、升级率和操作耗时。
5. 核心闭环通过后，增加官网 Widget、Docker Compose 和五分钟 Quick Start。

## License

本项目使用 [MIT License](./LICENSE)。

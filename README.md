# DeviceCare Agent

面向智能硬件售后的 AI 诊断辅助系统。它帮助客服在一次会话中完成信息收集、故障判断、工具查询、回复生成和人工交接。

项目先通过客服桌面工作台验证诊断闭环；核心能力稳定后，再提供可自托管的官网客服 Widget，让企业配置服务端模型密钥后，用一段脚本把受限的自助诊断入口嵌入官网。

M0 已在受控重构范围内通过，M1 可行性 POC 已正式启动；共享运行契约和冻结集校验已经落地，但尚无 Agent 模型实测结果。

## MVP

首版聚焦游戏手柄和三类真实客诉场景，验证“客服是否能更快、更稳定且安全地完成诊断”。

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
├─ evals/
│  └─ m0/
│     ├─ CASE_INTAKE.md   # 真实案例采集、事实复核与冻结工作表
│     ├─ DC-E01_BLACK_WARRIOR_3.md # 黑武士 3 事件档案与 8 条冻结案例
│     ├─ DC-E02_APEX_3_ADAPTIVE_TRIGGER.md # 八爪鱼 3 适配证据与 9 条冻结案例
│     ├─ DC-E03_APEX_4_STICK_BATCH.md # 八爪鱼 4 断轴事件与 8 条冻结案例
│     ├─ EVAL_CONTRACT.md # 模拟工具、评分、安全与冻结契约
│     ├─ eval-set.v0.1-frozen.json # 25 条机器可读冻结评测案例
│     ├─ PRE_FREEZE_REVIEW.md # 业务、证据边界与契约安全审核记录
│     ├─ FREEZE_MANIFEST.md # 冻结版本、证据声明与 SHA-256
│     ├─ BUSINESS_BASELINE_ROI.md # 已冻结的 M0 业务基线与三档 ROI 假设
│     └─ M0_ACCEPTANCE.md # M0 受控重构验收证据与阶段决定
├─ evals/m1/              # M1 运行契约、冻结集校验、测试与后续结果
├─ src/features/          # 诊断、知识与模拟工具的可执行契约
├─ package.json           # M1 类型检查、测试和冻结集校验命令
├─ docs/
│  ├─ architecture.md     # 技术方案唯一权威
│  └─ development-workflow.md # 多 Agent 开发协作流程
└─ AGENT_LESSONS.md       # 可复用失败教训
```

首批 25 条受控重构评测集、评分契约和 ROI 假设已经冻结，M0 已通过。M1 的 `DiagnosisState`、知识字段、7 类模拟工具和运行记录契约已通过自动校验；下一步实现最小评测运行器并保存正式原始输出。

## 阅读顺序

- 想了解项目：读本页。
- 想确认做什么、如何验收：读 `PROJECT_PROPOSAL.md`。
- 想补充真实事件或建立评测案例：读 `evals/m0/CASE_INTAKE.md`。
- 想查看冻结评测范围和证据声明：读 `evals/m0/FREEZE_MANIFEST.md`。
- 想查看立项基线、计算公式与 ROI 情景：读 `evals/m0/BUSINESS_BASELINE_ROI.md`。
- 想核对 M0 为什么可以通过、哪些仍未验证：读 `evals/m0/M0_ACCEPTANCE.md`。
- 想查看首个已整理事件：读 `evals/m0/DC-E01_BLACK_WARRIOR_3.md`。
- 想查看八爪鱼 3 适配节奏与公开反馈证据：读 `evals/m0/DC-E02_APEX_3_ADAPTIVE_TRIGGER.md`。
- 想开发或评审技术方案：读 `docs/architecture.md`。
- 想使用多 Agent 开发：读 `docs/development-workflow.md`。
- 想接手当前任务：读 `AGENTS.md` 和 `HANDOFF.md`。

## 近期里程碑

1. M0 受控重构验收已经通过；M1 状态、知识、工具和运行记录首版契约已经实现并验证。
2. 实现最小评测运行器并运行 M1 POC；达到正确率、有害答案、升级和引用门槛后再进入内部 MVP。
3. 建立最小知识库、诊断状态、模拟工具和端到端客服工作台流程。
4. 按 M2—M3 数据闸门扩充评测集并完成内部旁路试用。
5. M3 通过后，再增加官网 Widget、Docker Compose 和五分钟 Quick Start。

## License

本项目使用 [MIT License](./LICENSE)。

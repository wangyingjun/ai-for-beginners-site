# AI 助教（Phase 2 RAG + 用户自配 LLM）

中文优先。每位学习者可在浏览器里填写自己的 LLM 凭证；**仓库与 Supabase 不保存任何 API Key**。

## 推荐：在界面自行配置（localStorage）

打开 [`/assistant`](/assistant) 或课程页右下角「问助教」→ **API 设置**：

| 字段 | 说明 |
|------|------|
| **API 类型** | OpenAI 兼容 / Anthropic / Azure OpenAI |
| **API URL** | Base URL（如 `https://api.openai.com/v1`） |
| **API Key** | 密码输入框；仅存本浏览器 |
| **模型 / 部署名** | 可选；Azure 填部署名 |

- 保存在 **`localStorage`** 键 `ai-tutor-llm-settings-v1`；可一键清除。
- **不会**写入 Supabase、服务端磁盘或日志。
- 每次发问时，浏览器把 `credentials`（url / type / key）**按请求** POST 到 `/api/chat`；服务端仅在内存中用于本次 `streamText`，响应带 `Cache-Control: no-store`。
- **优先使用**用户浏览器凭证；若请求未带凭证，再回退到服务端环境变量（见下）。

### API 类型映射（Vercel AI SDK）

| UI 选项 | SDK adapter | 备注 |
|---------|-------------|------|
| OpenAI 兼容 | `@ai-sdk/openai` `createOpenAI` | 官方 OpenAI、多数兼容网关 |
| Anthropic | `@ai-sdk/anthropic` `createAnthropic` | 默认 `https://api.anthropic.com/v1` |
| Azure OpenAI | `@ai-sdk/azure` `createAzure` | URL 形如 `https://{resource}.openai.azure.com/openai`；模型栏填**部署名** |

## 已经可用（无需 Key）

| 能力 | 说明 |
|------|------|
| 语料切块 | `npm run build:rag` → `content/rag/chunks.json` |
| 离线检索 | `/api/chat` 在**生成前**用本地关键词（BM25-ish）检索；无 embedding 也可 demo |
| UI | 课程页「问助教」+ [`/assistant`](/assistant)；缺凭证时展示**设置表单**（不只是 503） |
| 反馈 / 限流 | 👍👎 stub；内存软限流（匿名 10/时，登录 60/时） |
| DB | Supabase：`doc_chunks`、`chat_sessions`、`chat_messages`（**不含** API Key） |

无生成 Key 时：本地关键词检索代码路径仍保留；生成接口返回 503 + 引导填写 UI，**不会**破坏检索脚手架。

## 可选：服务端环境变量（后备）

管理员可在 `.env.local` / Vercel 配置（OpenAI 兼容路径）。**仅当请求未带用户凭证时**使用：

```bash
# 任选其一作为 API Key
OPENAI_API_KEY=
# 或兼容网关：
# AI_GATEWAY_API_KEY=
# AI_API_KEY=

# 可选：兼容 OpenAI 的 base URL（默认 https://api.openai.com/v1）
# OPENAI_BASE_URL=
# AI_GATEWAY_BASE_URL=
# AI_BASE_URL=

# 可选：模型名
# AI_CHAT_MODEL=gpt-4o-mini
# AI_EMBEDDING_MODEL=text-embedding-3-small
```

检测（不泄露密钥）：

```bash
curl -s http://localhost:3000/api/chat | jq .
# {
#   "configured": false|true,          # 服务端 env
#   "serverConfigured": false|true,
#   "supportsUserCredentials": true,
#   "apiTypes": ["openai-compatible","anthropic","azure-openai"],
#   "docs": "/docs/ai-tutor",
#   "index": { chunkCount, ... }
# }
```

## 安全说明

1. **浏览器**：Key 只在 `localStorage`；清除站点数据或点「清除本地设置」即可删除。
2. **传输**：HTTPS 下 POST body 含 Key；与把 Key 放进前端直连第三方 API 类似的信任边界——本站选择经 `/api/chat` 代理以便做 RAG + 限流，且**不落盘**。
3. **服务端**：不把 Key 写入日志、文件或数据库；响应 `Cache-Control: no-store`。
4. **Git**：`.env*` 已忽略；勿提交真实密钥。`.env.example` 仅占位。

## 启用后行为

- 流式生成：Vercel AI SDK `streamText`
- 引用：系统提示强制课程链接；不编造；不直接给作业答案
- 响应头：`X-LLM-Source: user|env`、`X-LLM-Api-Type`、`X-Citations`、`X-RAG-Mode: local-keyword`

## Embedding（可选）

| 模型 | 维度 | 备注 |
|------|------|------|
| `text-embedding-3-small`（默认） | **1536** | 与迁移 `vector(1536)` 一致 |
| `text-embedding-3-large` | 3072（可降维） | 需改迁移或 dimensions |

有 Key 且要用 pgvector：对 `chunks.json` embedding 后用 **service role** upsert，再创建 HNSW。MVP 可继续只用本地 JSON 关键词检索。

## 相关文件

- `components/tutor/TutorChat.tsx` / `TutorSettingsForm.tsx` — UI + 设置表单
- `lib/rag/llm-settings.ts` / `user-settings-client.ts` — 类型与 localStorage
- `lib/rag/provider.ts` — 用户凭证优先，env 后备；多 provider
- `app/api/chat/route.ts` — 流式 API（ephemeral credentials）
- `scripts/build-rag-index.mjs` · `content/rag/chunks.json`
- `supabase/migrations/20261021120000_phase2_ai_tutor_rag.sql`

## 重建索引

```bash
npm run build:rag
npm run build
```

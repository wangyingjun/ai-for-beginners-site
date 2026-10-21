# AI 助教（Phase 2 RAG scaffold）

中文优先。本页说明如何启用课程助教：**仓库里不包含任何 API Key**；Yingjun 选择「先脚手架、稍后填 Key」。

## 已经可用（无需 Key）

| 能力 | 说明 |
|------|------|
| 语料切块 | `npm run build:rag` → `content/rag/chunks.json`（约 500–800 token/块，含 `lesson_id` / `path` / `heading` / `cell_index` / `lang`） |
| 离线检索 | `/api/chat` 在生成前用本地关键词（BM25-ish）检索；无 embedding 也可 demo |
| UI | 课程页右下角「问助教」面板 + [`/assistant`](/assistant) |
| 503 提示 | 未配置 Key 时 API 返回 **503** + 指向本文档的说明；UI 同步提示 |
| 反馈 / 限流 | 👍👎 stub（`/api/chat/feedback`）；内存软限流（匿名 10/时，登录 60/时） |
| DB | Supabase：`doc_chunks`（pgvector）、`chat_sessions`、`chat_messages`（见 `supabase/migrations/20261021120000_phase2_ai_tutor_rag.sql`） |

## 配置 Key 后可用

| 能力 | 说明 |
|------|------|
| 流式生成 | Vercel AI SDK `streamText` + OpenAI 兼容 provider |
| 引用 | 系统提示强制引用课程链接；不编造；不直接给作业答案 |
| 向量入库 | （可选）用 embedding 模型写入 `doc_chunks.embedding`，再开 HNSW |

## 环境变量（`.env.local` / Vercel）

**不要提交真实密钥。** 复制 `.env.example` 后按需填写：

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

# 已有 Supabase（进度 / Auth）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# 仅服务端：切块 upsert / 管理（切勿暴露到浏览器）
# SUPABASE_SERVICE_ROLE_KEY=
```

检测是否已配置（不泄露密钥）：

```bash
curl -s http://localhost:3000/api/chat | jq .
# { "configured": false|true, "docs": "...", "index": { chunkCount, ... } }
```

## 启用 OpenAI（或兼容网关）

1. 在 [OpenAI API Keys](https://platform.openai.com/api-keys)（或你的兼容网关控制台）创建密钥。
2. 写入本地 `.env.local` 的 `OPENAI_API_KEY=`，或 Vercel Project → Settings → Environment Variables。
3. 若用 Azure / 代理 / AI Gateway：同时设置 `OPENAI_BASE_URL`（或 `AI_GATEWAY_BASE_URL`）与对应 Key。
4. 重启 `npm run dev` / 重新部署。
5. 打开 `/assistant`，发送一句话；应开始流式回答并带课程链接。

**本仓库当前不声称已配置任何 Key。** `configured: false` 是预期状态，直到你填入密钥。

## Embedding 模型选择

| 模型 | 维度 | 备注 |
|------|------|------|
| `text-embedding-3-small`（默认） | **1536** | 与迁移里 `vector(1536)` 一致；性价比高 |
| `text-embedding-3-large` | 3072（可降维） | 需改迁移维度或 `dimensions` 参数后再建索引 |
| 网关自定义模型 | 以网关文档为准 | 必须与 `doc_chunks.embedding` 维度一致 |

有 Key 且要用 pgvector 时：

1. 对 `content/rag/chunks.json` 各块调用 embedding API。
2. 用 **service role** upsert 到 `doc_chunks`（`content`, metadata, `embedding`）。
3. 再创建 HNSW：

```sql
create index concurrently if not exists doc_chunks_embedding_hnsw
  on public.doc_chunks
  using hnsw (embedding vector_cosine_ops);
```

（迁移里刻意未在空表上建 HNSW，避免全 NULL embedding 失败。）

MVP 演示可继续只用本地 JSON 关键词检索，不必先 upsert 向量。

## 系统提示行为

- 基于检索片段回答，给出 `/lessons/[id]` 链接。
- 不确定就说不确定。
- 鼓励思考，**不直接倾倒作业/测验标准答案**。
- 标明「AI 生成，仅供参考」。

## 相关文件

- `scripts/build-rag-index.mjs` — 切块
- `content/rag/chunks.json` — 本地索引
- `lib/rag/*` — 检索 / provider / prompt / 限流
- `app/api/chat/route.ts` — 流式 API
- `components/tutor/TutorChat.tsx` — UI
- `supabase/migrations/20261021120000_phase2_ai_tutor_rag.sql`

## 重建索引

上游内容同步后：

```bash
npm run build:rag
npm run build   # 确认构建仍绿
```

# AI 助教（开源优先 · OpenAI 兼容 + 本地 RAG）

中文优先。每位学习者可在浏览器填写自己的 LLM 凭证；**仓库与 Supabase 不保存任何 API Key**。

技术路线：**不绑定单一闭源厂商**。生成侧走标准 **OpenAI-compatible** `POST /v1/chat/completions`（Ollama、LM Studio、vLLM、DeepSeek、硅基流动、OpenRouter 等均可）；检索侧用构建期 `content/rag/chunks.json` 的**开源关键词检索**（BM25-ish），回答必须带课程引用。可选后续再接开源 embedding + Supabase pgvector。

## 架构（简图）

```
学习者浏览器
  ├─ localStorage: API URL / 模型 / Key
  ├─ 本机 Ollama / LM Studio ──(浏览器直连 SSE)──► localhost:11434/v1
  └─ 云端 DeepSeek / SiliconFlow / … ──(经本站代理)──► /api/chat
                                                          │
/api/rag  ◄── 关键词检索 chunks.json（无 LLM）─────────────┘
/api/chat ◄── Vercel AI SDK streamText + 同一套 RAG
```

| 场景 | 谁调用模型 | 说明 |
|------|------------|------|
| **Ollama / LM Studio（localhost）** | **浏览器** | 先 `POST /api/rag` 取 system+citations，再直连本机 `/v1/chat/completions`。Vercel 服务器**碰不到**你的 localhost。 |
| **DeepSeek / 硅基流动 / OpenRouter / 任意公网兼容 API** | **本站 `/api/chat`** | 浏览器把凭证按请求 POST（仅内存）；服务端 `streamText` + RAG。 |
| **服务端环境变量** | `/api/chat` | 未带用户凭证时的后备（见下）。 |

## 推荐：界面快速预设（localStorage）

打开 [`/assistant`](/assistant) 或课程页「问助教」→ **API 设置**：

| 预设 | Base URL | 默认模型 | Key |
|------|----------|----------|-----|
| **Ollama（本机）** | `http://127.0.0.1:11434/v1` | `llama3.2` | 可留空 |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` | 必填 |
| **硅基流动** | `https://api.siliconflow.cn/v1` | `deepseek-ai/DeepSeek-V3` | 必填 |
| **OpenRouter** | `https://openrouter.ai/api/v1` | 任选开源/商业路由 | 必填 |
| **OpenAI 官方** | `https://api.openai.com/v1` | `gpt-4o-mini` | 必填 |
| **自定义 / LM Studio / vLLM** | 如 `http://127.0.0.1:1234/v1` | 你的模型名 | 本机可留空 |

- 保存在 **`localStorage`** 键 `ai-tutor-llm-settings-v1`；可一键清除。
- **不会**写入 Supabase、服务端磁盘或日志。
- 高级：仍可选 Anthropic / Azure OpenAI 类型（非默认路径）。

## 本机 Ollama 配置（推荐开源路径）

1. 安装并启动 [Ollama](https://ollama.com/)，拉取模型，例如：
   ```bash
   ollama pull llama3.2
   # 或: ollama pull qwen2.5:7b
   ```
2. 确认 OpenAI 兼容口可用：
   ```bash
   curl -s http://127.0.0.1:11434/v1/models
   curl -s http://127.0.0.1:11434/v1/chat/completions \
     -H 'Content-Type: application/json' \
     -d '{"model":"llama3.2","messages":[{"role":"user","content":"hi"}],"stream":false}'
   ```
3. **允许浏览器跨域**（助教页域名访问 localhost）。启动前设置，例如：
   ```bash
   # macOS / Linux 示例
   export OLLAMA_ORIGINS="https://ai-for-beginners-site.vercel.app,http://localhost:3000,*"
   ollama serve
   ```
   Windows 可用系统环境变量 `OLLAMA_ORIGINS`。详见 Ollama FAQ。
4. 打开站点 [`/assistant`](https://ai-for-beginners-site.vercel.app/assistant) → 预设选 **Ollama（本机）** → 模型填你 pull 的名字 → 保存 → 提问。
5. 本地开发（`npm run dev`）同样走浏览器直连；无需在 `.env` 里填 Key。

> **注意**：线上 Vercel 函数**不能**代替你访问 `127.0.0.1`。本站已对 localhost URL 走「浏览器直连」路径；若 CORS 未开，浏览器控制台会报错——请设置 `OLLAMA_ORIGINS`。

### LM Studio / vLLM

- LM Studio：开启本地 server，Base URL 多为 `http://127.0.0.1:1234/v1`，预设选「自定义」。
- vLLM：`--api-server` 提供 OpenAI 兼容口；公网部署走 `/api/chat` 代理，本机端口走浏览器直连。

## 已经可用（无需服务端 Key）

| 能力 | 说明 |
|------|------|
| 语料切块 | `npm run build:rag` → `content/rag/chunks.json` |
| 离线检索 | `/api/rag` + `/api/chat` 生成前关键词检索；无 embedding 也可工作 |
| 空检索 | UI 显示诚实提示；系统提示要求勿编造 |
| UI | 课程页「问助教」+ [`/assistant`](/assistant)；流式 + Markdown + 引用链到 `/lessons/{id}` |
| 反馈 / 限流 | 👍👎 stub；内存软限流 |
| DB | Supabase：`doc_chunks`、`chat_sessions`、`chat_messages`（**不含** API Key；向量入库可选） |

## 可选：服务端环境变量（后备）

仅当请求**未带**用户凭证时使用（OpenAI 兼容）：

```bash
OPENAI_API_KEY=
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# AI_CHAT_MODEL=deepseek-chat
# AI_EMBEDDING_MODEL=text-embedding-3-small
```

状态检查（不泄露密钥）：

```bash
curl -s http://localhost:3000/api/chat | jq .
curl -s http://localhost:3000/api/rag | jq .
```

## 安全说明

1. **浏览器**：Key 只在 `localStorage`；清除站点数据或点「清除本地设置」即可删除。
2. **本机直连**：Key/占位符不经过 Vercel，仅本机 Ollama 可见。
3. **云端代理**：HTTPS POST body 含 Key；服务端不落盘、不写日志；`Cache-Control: no-store`。
4. **Git**：`.env*` 已忽略；勿提交真实密钥。

## RAG 与引用

- **当前**：本地 JSON 关键词检索（`X-RAG-Mode: local-keyword`），课内加权，中英偏好。
- **引用**：响应头 `X-Citations`（UTF-8 安全）+ 回答内 Markdown 链接；UI 列出 `/lessons/{id}`。
- **空命中**：`X-Citations-Empty: 1` + 界面黄字提示，不假装有依据。
- **可选进阶**：用开源/兼容 embedding API 写入 Supabase `doc_chunks`（见迁移），再改 `retrieve.ts` 做混合召回——非 MVP 必需。

## 相关文件

- `components/tutor/TutorChat.tsx` / `TutorSettingsForm.tsx` / `TutorMarkdown.tsx`
- `lib/rag/llm-settings.ts` — 预设与 OpenAI 兼容类型
- `lib/rag/openai-compatible-stream.ts` — 浏览器 SSE
- `lib/rag/provider.ts` — 服务端 Vercel AI SDK adapter
- `app/api/rag/route.ts` — 仅检索
- `app/api/chat/route.ts` — 云端流式生成
- `scripts/build-rag-index.mjs` · `content/rag/chunks.json`

## 重建索引

```bash
npm run build:rag
npm run build
```

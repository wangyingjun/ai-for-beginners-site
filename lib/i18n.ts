export type Locale = "zh-CN" | "en";

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const locales: Locale[] = ["zh-CN", "en"];

const dict = {
  "zh-CN": {
    siteName: "AI 入门互动教学站",
    siteTagline: "基于 Microsoft AI-For-Beginners 的中文优先学习站",
    navHome: "首页",
    navCourse: "课程目录",
    navAbout: "关于",
    startLearning: "开始学习",
    viewCourse: "查看课程目录",
    lessons: "课程",
    modules: "模块",
    notebooks: "Notebook",
    hasNotebook: "含 Notebook",
    readingOnly: "纯阅读",
    dualFramework: "PyTorch / TensorFlow",
    framework: "框架",
    tier: "运行档位",
    tierA: "A · 浏览器可跑",
    tierB: "B · 外部内核",
    tierC: "C · 需 GPU",
    openColab: "在 Colab 打开",
    openCodespaces: "在 Codespaces 打开",
    openBinder: "在 Binder 打开",
    notebookOutput: "Notebook 输出（静态占位）",
    notebookOutputHint:
      "以下为上游已保存的静态输出（Tier A 抽样）。其余 notebook 请用 Colab / Codespaces / Binder 打开。",
    language: "语言",
    backToIndex: "返回课程目录",
    attribution:
      "课程内容源自 Microsoft 的 AI-For-Beginners（MIT 许可证）。本站代码亦采用 MIT。",
    upstreamLink: "上游仓库",
    introTitle: "能读、能跑、能玩的 AI 入门课",
    introBody:
      "本站将 microsoft/AI-For-Beginners 的 12 周 / 24+1 课整理为结构化学习体验：中文优先、中英切换，静态展示 notebook 输出，并为 PyTorch / TensorFlow 双版本提供标签页；后续接入 JupyterLite、测验、进度与 AI 助教。",
    phaseNote: "当前为 Phase 1 MVP 脚手架：内容清单与页面路由已就绪，上游同步与 Supabase / Vercel 接线稍后进行。",
    sampleNote: "正文来自上游 README（sparse sync）。图片路径已改写到本站静态资源。",
    placeholderBody: "本课正文将在上游内容同步后展示。可先通过下方按钮在外部环境打开 Notebook。",
    lab: "实验",
    prev: "上一课",
    next: "下一课",
  },
  en: {
    siteName: "AI for Beginners — Interactive Site",
    siteTagline: "Chinese-first learning site based on Microsoft AI-For-Beginners",
    navHome: "Home",
    navCourse: "Course",
    navAbout: "About",
    startLearning: "Start learning",
    viewCourse: "View course index",
    lessons: "Lessons",
    modules: "Modules",
    notebooks: "Notebooks",
    hasNotebook: "Has notebook",
    readingOnly: "Reading only",
    dualFramework: "PyTorch / TensorFlow",
    framework: "Framework",
    tier: "Runtime tier",
    tierA: "A · Browser-runnable",
    tierB: "B · External kernel",
    tierC: "C · Needs GPU",
    openColab: "Open in Colab",
    openCodespaces: "Open in Codespaces",
    openBinder: "Open in Binder",
    notebookOutput: "Notebook output (static placeholder)",
    notebookOutputHint:
      "Static saved outputs from upstream (Tier A sample). Open other notebooks via Colab / Codespaces / Binder.",
    language: "Language",
    backToIndex: "Back to course index",
    attribution:
      "Curriculum content from Microsoft AI-For-Beginners (MIT). Site code is also MIT-licensed.",
    upstreamLink: "Upstream repo",
    introTitle: "Read, run, and play — AI for beginners",
    introBody:
      "This site turns microsoft/AI-For-Beginners (12 weeks / 24+1 lessons) into a structured experience: Chinese-first with en/zh-CN switching, static notebook outputs, and PyTorch/TensorFlow tabs. JupyterLite, quizzes, progress, and an AI tutor come next.",
    phaseNote:
      "Phase 1 MVP scaffold: content manifest and routes are ready. Upstream sync and Supabase/Vercel wiring follow.",
    sampleNote:
      "Body from upstream README (sparse sync). Image paths rewritten to local static assets.",
    placeholderBody:
      "Lesson body will appear after upstream sync. Use the buttons below to open notebooks externally for now.",
    lab: "Lab",
    prev: "Previous",
    next: "Next",
  },
} as const;

export type DictKey = keyof (typeof dict)["zh-CN"];

export function t(locale: Locale, key: DictKey): string {
  return dict[locale][key] ?? dict["zh-CN"][key] ?? key;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en";
}

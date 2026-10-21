export type Framework = "pytorch" | "tensorflow" | "numpy" | "keras";

export type RuntimeTier = "A" | "B" | "C";

export type LocalizedString = {
  "zh-CN": string;
  en: string;
};

export type NotebookRef = {
  framework: Framework | string;
  file: string;
};

export type LessonManifest = {
  id: string;
  slug: string;
  module: string;
  path: string;
  title: LocalizedString;
  hasNotebook: boolean;
  frameworks: string[];
  hasLab: boolean;
  tier: RuntimeTier | null;
  notebooks?: NotebookRef[];
  sampleContent?: boolean;
  hasLocalMarkdown?: { en?: boolean; "zh-CN"?: boolean };
  hasStaticNotebook?: boolean;
  staticNotebooks?: string[];
  jupyterlite?: string[];
};

export type ModuleManifest = {
  id: string;
  title: LocalizedString;
  order: number;
};

export type ContentManifest = {
  upstream: {
    repo: string;
    commit: string;
    license: string;
    syncedAt?: string;
  };
  modules: ModuleManifest[];
  lessons: LessonManifest[];
};

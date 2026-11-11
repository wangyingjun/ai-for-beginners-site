/**
 * Beginner learning path (zh-CN), see docs/课程优化方案.md §3.
 * Ids are /lessons/<id> routes: upstream lesson ids ("03") or site-only
 * micro-lessons ("data", "loss", "gd") that have no upstream counterpart.
 */

export type PathLesson = {
  id: string;
  title: string;
  minutes: number;
  /** Lesson ids to finish first. */
  prereq: string[];
  /** 学完能做到… */
  canDo: string;
  /** New terms (≤ 2). */
  terms: string[];
};

export type PathStage = {
  id: string;
  title: string;
  blurb: string;
  lessons: string[];
  optional?: boolean;
};

export const PATH_LESSONS: Record<string, PathLesson> = {
  "01": { id: "01", title: "AI 是怎么从例子里学会的", minutes: 20, prereq: [], canDo: "说清「写规则」和「给例子」两种让电脑变聪明的办法", terms: ["训练数据", "模型"] },
  data: { id: "data", title: "数据就是一堆点", minutes: 20, prereq: ["01"], canDo: "把一样东西变成坐标纸上的一个点，并挑出有用的角度", terms: ["特征"] },
  "03": { id: "03", title: "画一条线把两类分开：感知机", minutes: 25, prereq: ["data"], canDo: "看懂机器怎样从错误里学会画分界线，知道一条直线的极限", terms: ["感知机", "学习率"] },
  loss: { id: "loss", title: "错得有多离谱：误差", minutes: 20, prereq: ["03"], canDo: "用一个数字衡量模型好不好", terms: ["损失"] },
  gd: { id: "gd", title: "蒙眼下山：梯度下降", minutes: 25, prereq: ["loss"], canDo: "解释机器怎样一步步把误差降下来，以及步子太大会怎样", terms: ["梯度下降"] },
  "04": { id: "04", title: "让线拐弯：多层网络与误差回传", minutes: 25, prereq: ["03", "gd"], canDo: "知道为什么要「叠层」，以及误差怎样往回分配给每一层", terms: ["隐藏层", "反向传播"] },
  "05": { id: "05", title: "死记硬背 vs 真懂了：过拟合", minutes: 20, prereq: ["04"], canDo: "从两条误差曲线看出模型是不是在「背答案」", terms: ["过拟合", "验证集"] },
  "06": { id: "06", title: "图片就是一格格数字：像素与卷积核", minutes: 25, prereq: ["data"], canDo: "知道电脑眼里的图片长什么样，以及小窗口怎样找出边缘", terms: ["像素", "卷积核"] },
  "07": { id: "07", title: "在哪儿都能认出来：卷积神经网络", minutes: 25, prereq: ["06", "04"], canDo: "解释为什么卷积网络换了位置也能认出图案", terms: ["卷积神经网络", "池化"] },
  "08": { id: "08", title: "站在巨人肩上：迁移学习", minutes: 20, prereq: ["07"], canDo: "知道为什么只给几张图也能训练出好用的分类器", terms: ["预训练", "迁移学习"] },
  "13": { id: "13", title: "把句子变成数字：数词频", minutes: 20, prereq: ["data"], canDo: "把一句话变成一串数字，并说出这种办法丢了什么", terms: ["词袋"] },
  "14": { id: "14", title: "意思相近的词住得近：词向量", minutes: 25, prereq: ["13"], canDo: "在词地图上找邻居、做「国王−男人+女人」", terms: ["词向量"] },
  "17": { id: "17", title: "猜下一个字：语言模型与温度", minutes: 25, prereq: ["14"], canDo: "解释 AI 写作就是一次次按概率选下一个字，温度控制多「放飞」", terms: ["语言模型", "温度"] },
  "18": { id: "18", title: "读到「它」时该看谁：注意力", minutes: 25, prereq: ["17"], canDo: "看懂注意力热力图：每个词在「看」哪些词", terms: ["注意力"] },
  "20": { id: "20", title: "同一个模型，换种问法：提示词", minutes: 20, prereq: ["18"], canDo: "写出更好的提示词，知道「给例子」为什么管用", terms: ["提示词", "少样本"] },
  "02": { id: "02", title: "不靠数据靠规则：专家系统", minutes: 20, prereq: ["01"], canDo: "说出规则系统的长处（讲得清）和短处（写不全）", terms: ["专家系统"] },
  "21": { id: "21", title: "物竞天择找答案：遗传算法", minutes: 20, prereq: ["gd"], canDo: "知道不求坡度也能优化：选择、交叉、变异", terms: ["遗传算法"] },
  "22": { id: "22", title: "只给奖励不给答案：强化学习", minutes: 25, prereq: ["gd"], canDo: "用平衡小车说明奖励、试错与策略", terms: ["奖励", "策略"] },
  "24": { id: "24", title: "准确率高也可能伤人：AI 伦理", minutes: 20, prereq: [], canDo: "发现一个模型对不同人群是否公平", terms: ["偏见"] },
  "09": { id: "09", title: "压缩再还原：自编码器", minutes: 20, prereq: ["06"], canDo: "知道「用很少的数字记住一张图」的意思", terms: ["自编码器", "瓶颈"] },
  "10": { id: "10", title: "假币犯和警察：生成对抗网络", minutes: 20, prereq: ["04"], canDo: "说清生成器和判别器怎样互相较劲", terms: ["生成器", "判别器"] },
  "11": { id: "11", title: "框出物体在哪：目标检测", minutes: 20, prereq: ["07"], canDo: "画框并用重合度判断框得准不准", terms: ["边界框", "交并比"] },
  "12": { id: "12", title: "每个像素属于谁：语义分割", minutes: 20, prereq: ["11"], canDo: "区分「画框」和「逐像素涂色」两种答案", terms: ["语义分割"] },
  "15": { id: "15", title: "遮住一个词来猜：自己训练词向量", minutes: 20, prereq: ["14"], canDo: "解释「靠上下文猜词」怎样逼出词向量", terms: ["上下文窗口"] },
  "16": { id: "16", title: "边读边记：循环神经网络", minutes: 20, prereq: ["15"], canDo: "知道网络怎样一边读一边更新「记忆」，以及为什么会忘", terms: ["循环神经网络", "隐藏状态"] },
  "19": { id: "19", title: "找出人名地名：命名实体识别", minutes: 20, prereq: ["18"], canDo: "给句子里的词打标签，知道查词典为什么不够", terms: ["命名实体"] },
  "23": { id: "23", title: "对手也在学：多智能体", minutes: 20, prereq: ["22"], canDo: "通过重复博弈看出「别人的策略会改变你的最优策略」", terms: ["多智能体", "博弈"] },
  X1: { id: "X1", title: "图和字住进同一个空间：多模态", minutes: 20, prereq: ["14", "08"], canDo: "解释为什么不训练也能「零样本」认图", terms: ["多模态", "零样本"] },
};

export const PATH_STAGES: PathStage[] = [
  { id: "s0", title: "阶段 0 · 先玩起来", blurb: "不用任何基础，先看看 AI 到底在干什么。", lessons: ["01", "data"] },
  { id: "s1", title: "阶段 1 · 机器怎么「学」", blurb: "全站核心：分界线、误差、下山、叠层、背答案。", lessons: ["03", "loss", "gd", "04", "05"] },
  { id: "s2", title: "阶段 2 · 让机器看懂图片", blurb: "像素、小窗口、卷积网络、借用别人的眼睛。", lessons: ["06", "07", "08"] },
  { id: "s3", title: "阶段 3 · 让机器读懂和写出文字", blurb: "从数词频到大模型：词向量、猜下一个字、注意力、提示词。", lessons: ["13", "14", "17", "18", "20"] },
  { id: "s4", title: "阶段 4 · 其他思路与责任", blurb: "规则、进化、试错，以及 AI 该怎么负责任地用。", lessons: ["02", "21", "22", "24"] },
  { id: "sx", title: "进阶 / 选修", blurb: "核心路径之外的课：同样先做实验，原课程（框架、重训练、Notebook）在每课的「进阶」里。", lessons: ["09", "10", "11", "12", "15", "16", "19", "23", "X1"], optional: true },
];

/** Site-only lessons (no upstream content). */
export const EXTRA_LESSON_IDS = ["data", "loss", "gd"] as const;

export function isExtraLesson(id: string): boolean {
  return (EXTRA_LESSON_IDS as readonly string[]).includes(id);
}

export function pathOrder(): string[] {
  return PATH_STAGES.flatMap((s) => s.lessons);
}

export function stageOf(id: string): PathStage | undefined {
  return PATH_STAGES.find((s) => s.lessons.includes(id));
}

export function pathNeighbors(id: string): { prev?: PathLesson; next?: PathLesson } {
  const order = pathOrder();
  const i = order.indexOf(id);
  if (i === -1) return {};
  return {
    prev: i > 0 ? PATH_LESSONS[order[i - 1]] : undefined,
    next: i < order.length - 1 ? PATH_LESSONS[order[i + 1]] : undefined,
  };
}

/** localStorage key set by the practice experiment when all its tasks are done. */
export function experimentDoneKey(id: string): string {
  return `exp:${id}:practice:complete`;
}

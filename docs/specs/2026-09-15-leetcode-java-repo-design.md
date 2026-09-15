# leetcode-java 刷题仓库设计文档

- 日期：2026-09-15
- 状态：已评审通过（待写实施计划）
- 仓库名：`leetcode-java`

---

## 1. 背景与目标

建立一个长期维护的算法刷题仓库：每天上传一道或几道已刷题目，**按用到的算法分类归档**。

仓库定位为「两者兼顾」：**先满足个人学习与复习，但结构与文档标准按求职作品集搭建**。

之所以强调「结构一次做对」，是因为题目积累到几百道后，目录结构、命名规范、元数据格式的改造成本极高（每次调整都会在 git 历史里产生大量 rename，破坏 `git log --follow` 连续性）。

### 1.1 成功标准

| 维度 | 标准 |
|---|---|
| 可坚持性 | 每天「最小可交付」≤ 15 分钟；能连续坚持 300 天以上 |
| 可检索性 | 能按算法分类检索；能按细粒度标签交叉检索 |
| 可复利性 | 半年后回看，笔记能让自己回忆起「当时为什么这么想」，而不只是看懂代码 |
| 作品集可用 | 面试官点进来能看懂仓库结构、代码风格统一、有 LICENSE |

### 1.2 非目标（YAGNI）

明确**不做**的事，避免范围膨胀：

- ❌ 每道题配可运行测试（用户明确不要）——但保留编译检查作为兜底（见 §7）
- ❌ 用脚本自动生成「题解文章」（笔记必须用自己的话写，否则失去复利价值）
- ❌ 一题多语言实现（主语言 Java，不为展示力翻倍工作量）
- ❌ 自动化每日打卡 / 定时提交（假勤奋，且会产出无意义 commit）
- ❌ 多平台（Codeforces 等）支持——先只做 LeetCode，保持元数据简单

---

## 2. 需求确认（决策记录）

以下为设计阶段与用户逐条确认的决策，供后续回溯：

| 决策点 | 结论 | 影响 |
|---|---|---|
| 仓库定位 | 两者兼顾：个人积累 + 作品集标准结构 | 目录英文、README 精美、必须有 LICENSE |
| 主语言 | **Java** | 按「算法分类 / 题目」两层，不做语言分层 |
| 题目来源 | **LeetCode 为主** | 题号稳定，元数据简单（无平台维度） |
| 每题内容 | 代码 + 思路笔记 + 复杂度 + 一题多解 + 踩坑记录 + 关联题/标签 | 笔记模板含对应六个章节 |
| 每题内容（不做） | **不做可运行测试** | 增加编译检查兜底 |
| 自动化程度 | 脚手架脚本 + README 索引自动生成 | 两个 Node 脚本 + front-matter 解析库 |
| 归档方案 | **方案 A：主分类目录 + 标签交叉索引** | 单一副本，永不内容漂移 |

### 2.1 方案选型回顾

核心分歧是「一道题同时属于多个算法分类时，文件怎么放」。

- **方案 A（采纳）**：每题只存一份，放主分类目录；元数据记录全部标签；脚本生成「按分类」与「按标签」两份索引。
  - 优点：物理上真的按算法分类存（GitHub 网页层次清晰）；单一副本永不漂移
  - 代价：需人工选一个主分类（可由脚手架推荐，摩擦极低）
- **方案 B（否决）**：题目平铺，纯标签驱动。目录最简，但丢失算法层次感，与「按算法分类存」的原始需求冲突。
- **方案 C（否决）**：一题在多个分类目录各放一份。复制会导致内容漂移；软链接在 Windows 上麻烦且 GitHub 只显示为文本链接。

---

## 3. 环境事实

设计前实测的本地环境（决定技术选型）：

| 工具 | 版本 | 用途 / 影响 |
|---|---|---|
| Node.js | v26.1.0 | ✅ 脚本语言选型（本地 + GitHub Actions 通用） |
| Java | OpenJDK 21 | ✅ 可真实执行编译检查 |
| Git | 2.54.0 | ✅ 本地初始化与推送 |
| PowerShell | **5.1**（非 7） | ⚠️ 无内置 YAML 解析器 → **排除用 PowerShell 写脚本** |
| gh CLI | 未安装 | 建远程仓库走网页，或后续安装 gh |

**关键推论**：脚本用 **Node.js** 而非 PowerShell。理由是 PowerShell 5.1 解析 YAML 需要额外模块，且 Windows 专用脚本无法在 GitHub Actions（ubuntu runner）上复用。

---

## 4. 目录结构

```
leetcode-java/
├── README.md                         【自动生成区】分类索引 + 进度统计
├── INDEX-BY-TAG.md                   【自动生成】标签交叉索引
├── LICENSE                           MIT
├── .gitignore                        *.class / target/ / .idea/ / out/
├── .gitattributes                    统一换行符为 LF（见 §9 注意点 9）
├── categories.yml                    ★ 分类与标签的唯一真相源
├── docs/
│   ├── TEMPLATE.md                   题目笔记模板
│   └── specs/                        设计文档（本文件）
├── problems/                         ★ 题目按主分类归档
│   ├── 01-array-hash/
│   │   └── lc-0001-two-sum/
│   │       ├── README.md             思路笔记（中文）
│   │       ├── Solution.java         最优解，可直接粘贴提交
│   │       └── SolutionAlt.java      可选：值得独立保留的备选解
│   ├── 02-two-pointers/
│   ├── 03-sliding-window/
│   ├── 04-binary-search/
│   ├── 05-stack-queue/
│   ├── 06-linked-list/
│   ├── 07-binary-tree/
│   ├── 08-graph/
│   ├── 09-backtracking/
│   ├── 10-dynamic-programming/
│   ├── 11-greedy/
│   ├── 12-heap/
│   ├── 13-trie/
│   ├── 14-union-find/
│   ├── 15-bit-manipulation/
│   ├── 16-math/
│   ├── 17-string/
│   └── 18-design/
└── tools/
    ├── new-problem.mjs               脚手架：创建题目骨架
    ├── build-index.mjs               扫描生成两份索引
    ├── check-compile.mjs             逐目录 javac 编译检查
    ├── lib/
    │   ├── frontmatter.mjs           零依赖 front-matter 解析/序列化
    │   └── categories.mjs            读取并校验 categories.yml
    └── tests/                        node:test 测试（不引入 npm 依赖）
        ├── frontmatter.test.mjs
        ├── build-index.test.mjs
        └── new-problem.test.mjs
```

### 4.1 命名规则

| 对象 | 规则 | 示例 |
|---|---|---|
| 分类目录 | `<两位编号>-<英文kebab>` | `10-dynamic-programming` |
| 题题目录 | `lc-<四位题号>-<slug>` | `lc-0001-two-sum` |
| slug | 英文 kebab-case，**长度上限 40 字符** | `trapping-rain-water` |
| 笔记 | 固定 `README.md`（中文内容） | — |
| 主解法 | 固定 `Solution.java` | — |
| 备选解法 | `SolutionAlt.java`（可多个：`SolutionAlt2.java`） | — |

**目录英文 + 笔记中文**是刻意选择：英文路径对面试官、CI、跨平台脚本友好；中文笔记对个人复习友好。

### 4.2 不预建分类目录

**不在初始化时创建那 18 个空目录**。理由：

1. git 不追踪空目录，创建了也提交不上去
2. 点进仓库看到 18 个空壳目录，观感像烂尾项目
3. 分类清单由 `categories.yml` 承载，目录由脚手架**按需创建**
4. 但 README 索引**始终列出全部 18 个分类**（无题的显示 0），保证分类体系可见

---

## 5. 分类体系与元数据

### 5.1 categories.yml —— 双白名单

该文件是「分类」与「标签」的唯一真相源，同时解决两个问题：物理归档定位、标签爆炸防治。

```yaml
# 决定物理目录的分类（编号一经分配永不重排，新分类一律追加）
categories:
  - { id: 01-array-hash,          name: 数组与哈希表 }
  - { id: 02-two-pointers,        name: 双指针 }
  - { id: 03-sliding-window,      name: 滑动窗口 }
  - { id: 04-binary-search,       name: 二分查找 }
  - { id: 05-stack-queue,         name: 栈与队列 }
  - { id: 06-linked-list,         name: 链表 }
  - { id: 07-binary-tree,         name: 二叉树 }
  - { id: 08-graph,               name: 图论（BFS/DFS/拓扑） }
  - { id: 09-backtracking,        name: 回溯 }
  - { id: 10-dynamic-programming, name: 动态规划 }
  - { id: 11-greedy,              name: 贪心 }
  - { id: 12-heap,                name: 堆与优先队列 }
  - { id: 13-trie,                name: 字典树 }
  - { id: 14-union-find,          name: 并查集 }
  - { id: 15-bit-manipulation,    name: 位运算 }
  - { id: 16-math,                name: 数学 }
  - { id: 17-string,              name: 字符串 }
  - { id: 18-design,              name: 设计题 }

# 受控标签词表（脚本强校验，杜绝自由发挥导致索引腐烂）
# 新增标签必须显式编辑本文件 —— 显式动作是有意的摩擦
tags:
  # —— 基础技巧 ——
  - 数组
  - 字符串
  - 哈希表
  - 哈希集合
  - 双指针
  - 快慢指针
  - 滑动窗口
  - 前缀和
  - 差分数组
  - 二分
  - 二分答案
  - 排序
  - 归并排序
  - 快速选择
  - 摩尔投票
  - 模拟
  # —— 数据结构 ——
  - 栈
  - 单调栈
  - 队列
  - 单调队列
  - 双端队列
  - 优先队列
  - 链表反转
  - 环形链表
  - 二叉树遍历
  - 层序遍历
  - 二叉搜索树
  - 字典树
  - 并查集
  - LRU
  - 设计数据结构
  # —— 图与搜索 ——
  - DFS
  - BFS
  - 拓扑排序
  - 最短路
  - 网格搜索
  - 记忆化搜索
  # —— 动态规划 ——
  - 线性DP
  - 区间DP
  - 树形DP
  - 背包
  - LIS
  - 编辑距离
  - 状态压缩
  - 记忆化搜索
  # —— 数学与位运算 ——
  - 位运算技巧
  - 位掩码
  - 快速幂
  - 质数筛
  - 最大公约数
  - 数学归纳
  # —— 字符串专项 ——
  - KMP
  - 字符串匹配
  # —— 其他 ——
  - 贪心证明
  - 区间调度
  - 分治
  - 递归
  - 矩阵
  - 螺旋矩阵
```

**两道保险**：

1. 标签不在词表 → 脚本**报错拒绝执行**（避免 `dp` / `动态规划` / `dynamic-programming` 三种写法并存）
2. **分类编号一经分配永不重排**。新增分类追加 `19-`、`20-`。重排会让 git 历史塞满 rename

#### 词表维护规则

- **近义标签只保留一个**。词表里刻意不出现 `记忆化` 与 `记忆化搜索` 并存的情况——相邻概念的近义写法正是让索引腐烂的原因。新增标签前先检索词表里有没有「其实就是同一个意思」的现有项。
- **标签与分类同名是允许的，而且是有意为之**。标签用于标记题目的**次要技巧**：一道归档在 `10-dynamic-programming` 的题，可以带 `二分` 标签，从而在「按标签检索二分」时被找到。但**分类名不会自动继承为标签**，需要显式添加——这样标签表才是你真实的技术分布，而不是目录结构的回声。
- 标签总数控制在 60 个上下。超过这个量级说明粒度失控，应删掉低频标签或将其升格为分类。

### 5.2 题目元数据：README 的 YAML front-matter

选择 front-matter 而非独立 `meta.yml` 的理由：**GitHub 会自动把 front-matter 渲染成仓库页面顶部的信息表格**，白送一张题目信息卡；同时脚本可解析，无需维护第二个文件。

```markdown
---
id: lc-0001
title: 两数之和
category: 01-array-hash
tags: [数组, 哈希表]
difficulty: Easy
status: 独立完成
url: https://leetcode.cn/problems/two-sum/
date: 2026-09-15
---
```

字段定义：

| 字段 | 必填 | 取值 | 说明 |
|---|---|---|---|
| `id` | ✅ | `lc-<四位题号>` | 全局唯一，脚本校验重复。题号不足四位左补零（`lc-0001`），超过四位则原样保留 |
| `title` | ✅ | 中文题名 | 用 LeetCode 中文站题名 |
| `category` | ✅ | `categories.yml` 中的 id | 必须与**文件所在目录**一致 |
| `tags` | ✅ | 词表内的标签数组 | 至少 1 个 |
| `difficulty` | ✅ | `Easy` / `Medium` / `Hard` | — |
| `status` | ✅ | `未开始` / `独立完成` / `看题解完成` / `未通过` | 驱动复习 |
| `url` | ✅ | LeetCode 链接 | 替代题面（版权） |
| `date` | ✅ | `YYYY-MM-DD` | 首次完成日期 |

#### 刻意限制

front-matter **只允许扁平键值 + 单行数组**：不嵌套、不多行字符串（`|` / `>`）。

理由：这样零依赖手写解析器（约 40 行）即可可靠工作，不必为 `yaml` 包引入 npm 依赖——刷题仓库不该有 `node_modules`。该限制写入 `docs/TEMPLATE.md`，属于**规范的一部分**，不遵守会被脚本拒绝。

### 5.3 笔记模板（docs/TEMPLATE.md）

```markdown
---
id: lc-0001
title: 两数之和
category: 01-array-hash
tags: [数组, 哈希表]
difficulty: Easy
status: 独立完成
url: https://leetcode.cn/problems/two-sum/
date: 2026-09-15
---

# lc-0001 两数之和

## 思路

（用自己的话写：为什么想到哈希表？暴力解的瓶颈在哪？）

## 复杂度

- 时间：O(n)
- 空间：O(n)

## 解法演进

1. 暴力双重循环 O(n²) —— 瓶颈：内层本质是在「查找 target - x」
2. 哈希表一次遍历 O(n) —— 边遍历边查边存，规避重复元素问题

## 踩坑

- 不能先全部入 map 再遍历（会用到元素自己）；必须边遍历边查边存

## 关联题

- lc-0167 两数之和 II（有序数组 → 双指针）
- lc-0015 三数之和
```

⚠️ **模板刻意不含「题目描述」章节**。原因见 §9 注意点 1（版权）。

### 5.4 一题多解在 Java 中的存放规则

**硬约束**：LeetCode 的 Java 提交要求 `public class Solution` 与精确方法签名；且同一目录下不能存在两个同名 `public class Solution`。

据此确定的规则：

| 场景 | 做法 |
|---|---|
| 最优解 | `Solution.java` → `public class Solution`，**可原样复制粘贴提交** |
| 解法演进过程 | 写在 README 的「解法演进」章节，用代码块（不参与编译） |
| 值得独立保留的备选解 | `SolutionAlt.java` → `class SolutionAlt`（提交时需改名） |

附带两条铁律（新人常翻车）：

1. **绝不写 `package` 声明** —— 写了 LeetCode 提交直接报错
2. **全局编译检查必须「每个题目录单独执行一次 javac」** —— 几十个文件都叫 `class Solution`，放一起编译必然冲突

---

## 6. 脚本设计

### 6.1 tools/new-problem.mjs —— 脚手架

```bash
node tools/new-problem.mjs --id 1 --title "两数之和" --slug two-sum \
    --cat 01-array-hash --tags 数组,哈希表 --difficulty Easy \
    [--url <url>] [--date YYYY-MM-DD] [--status <状态>] [--dry-run]
```

**`--title` 与 `--slug` 是两个独立参数，不可混用**：`--title` 是**中文题名**（写入 front-matter，供人阅读），`--slug` 是 **LeetCode 英文 URL slug**（决定目录名，供脚本与 CI 使用）。这种「目录英文、内容中文」的分离与 §4.1 命名规则一致；中文题名无法可靠转英文 slug，所以 slug 必须显式提供。

参数默认值：

| 参数 | 缺省行为 |
|---|---|
| `--url` | 由 slug 拼出 `https://leetcode.cn/problems/<slug>/` |
| `--date` | 本地时区的今天 |
| `--status` | `未开始` |
| `--slug` | **无缺省，必填** |

行为：

1. **四项校验**（任一不过则报错退出，退出码 1）：
   - `id` 是否已存在于 `problems/`（防重复）
   - `cat` 是否为 `categories.yml` 中的合法 id
   - 每个 `tags` 是否都在词表内（列出非法项）
   - `difficulty` / `status` 是否为合法枚举
2. 规范化 slug（转小写、空格转连字符）；**slug 超 40 字符则报错**（Windows 路径长度保护，见注意点 7）
3. 创建 `problems/<cat>/lc-<id>-<slug>/`
4. 依据 `docs/TEMPLATE.md` 生成 `README.md`：front-matter 全部字段自动填好，正文五个小节留空
5. 生成 `Solution.java` 骨架（合法可编译，含思路/复杂度注释位）
6. ⚠️ **目录已存在则直接报错退出，绝不覆盖** —— 防止手滑毁掉已写好的笔记
7. 输出下一步提示：该编辑哪两个文件、该跑哪条命令

**可选增强（第二阶段）**：`--fetch` 联网从 LeetCode 拉取标题/slug/难度。放在第二阶段是因为该接口非官方、随时可能失效——**主流程不得依赖网络**，失败必须降级为手动输入。

### 6.2 tools/build-index.mjs —— 索引生成

```bash
node tools/build-index.mjs [--check] [--dry-run]
```

行为：

1. 扫描 `problems/*/*/README.md`，解析 front-matter
2. **一致性校验**：
   - 必填字段齐全、`status`/`difficulty` 枚举合法
   - `category` 字段必须与文件所在目录名一致（抓出「移动了文件但忘了改 category」的静默错位）
   - `id` 全局唯一
3. 生成 `README.md`：
   - 进度统计：总题数、各难度分布、最近更新日期
   - 主体：18 个分类的题表（`| 题号 | 题名 | 难度 | 标签 | 状态 | 日期 |`），无题分类显示 0
   - **排序规则（消除歧义）**：分类按 id 升序；分类内题目按题号数值升序
4. 生成 `INDEX-BY-TAG.md`：标签 → 题目映射。**多标签题在此出现多次，这就是方案 A 解决「一题多分类」的交叉索引**
   - **排序规则**：标签严格按 `categories.yml` 中的词表顺序（而非字母序或出现频率），使索引顺序稳定且可预期；标签内题目按题号升序
5. ⚠️ **关键设计**：生成内容包裹在 `<!-- AUTO-GENERATED:START -->` / `<!-- AUTO-GENERATED:END -->` 之间，脚本**只替换标记内的部分**。README 顶部手写的项目介绍、复习方法、心路历程永不被脚本冲掉
6. ⚠️ **幂等**：内容无变化则不写文件，避免无意义的 git diff 污染历史
7. `--check`：只校验不写入，供 CI / 提交前钩子使用，有违规则退出码 1

### 6.3 tools/check-compile.mjs —— 编译检查

```bash
node tools/check-compile.mjs
```

用户明确不要每题的可运行测试，但**没有任何守门机制的代码会烂掉**。折中方案：

- 遍历每个题目录，**单独**执行一次 `javac *.java`（见 §5.4 铁律 2）
- 编译产物输出到系统临时目录下的独立子目录（**不写进仓库**），检查后清理，不产生 `.class` 残留
- 跳过 `status: 未开始` 的题（骨架尚未编写，本就编译不过）
- 失败时列出题目目录与 javac 错误摘要，退出码 1

成本极低（约 30 行），但能保证「已完成的题在半年后仍然能编译」。

### 6.4 tools/lib/frontmatter.mjs —— 零依赖解析

```js
parseFrontmatter(text)  // → { data, body, errors }
stringifyFrontmatter(data) // → string
```

只支持 `key: value` 与 `key: [a, b, c]` 两种形态（即 §5.2 的刻意限制）。遇到嵌套或 `|` / `>` 多行语法时**报错而非静默忽略**，避免元数据悄悄丢失。

---

## 7. 数据流

```
每天：
  ① new-problem.mjs  ──读取──> categories.yml（校验）
                     ──写入──> problems/<cat>/lc-xxxx-slug/{README.md, Solution.java}
  ② 人工填写          ──编辑──> README.md 正文（思路/复杂度/解法演进/踩坑/关联题）
                              Solution.java（主解法）
  ③ build-index.mjs  ──扫描──> problems/**/README.md（front-matter）
                     ──生成──> README.md（标记区间内）、INDEX-BY-TAG.md
  ④ git add/commit   ──提交──> 规范化的提交信息
```

索引**永远由题目文件单向派生**（`problems/` 是唯一真相源，索引是产物）。因此索引文件在 git 中是提交的，但**不应手工编辑**——若发生冲突，直接重跑脚本即可。

---

## 8. 错误处理与校验策略

| 场景 | 处理 |
|---|---|
| 题号重复 | 报错退出，提示已存在的目录路径 |
| 分类 id 非法 | 报错退出，列出所有合法 id |
| 标签非法 | 报错退出，**逐条列出非法标签**并提示「如确需新增，请编辑 categories.yml」 |
| 目录已存在 | 报错退出，**绝不覆盖** |
| front-matter 字段缺失/枚举非法 | `build-index --check` 报错，退出码 1 |
| `category` 与实际目录不一致 | 报错，明确指出「文件在 X，但 category 写的是 Y」 |
| front-matter 出现嵌套语法 | 解析器报错，不静默忽略 |
| 网络不可用（`--fetch`） | 降级为手动输入，**不阻断主流程** |

约定退出码：`0` 成功 / `1` 校验失败 / `2` 用法错误。

**设计原则：校验失败一律「响亮地失败」**。刷题仓库最怕的不是报错，而是元数据悄悄写坏、半年后索引不可用。

---

## 9. 注意事项清单

按重要性排序，**前 4 条是会真正导致翻车的**：

| # | 注意点 | 为什么 |
|---|---|---|
| 1 | **不要整段复制 LeetCode 题面** | 题面有版权，这是仓库被举报 / DMCA 下架的主因。只写「自己的思路 + 关键约束 + 原题链接」，因此模板刻意不设「题目描述」章节 |
| 2 | **标签必须走白名单，禁止自由发挥** | 一旦出现 `dp` / `动态规划` / `dynamic-programming` 三种写法，索引即失效。由 `new-problem.mjs` 强校验 |
| 3 | **README 索引必须自动生成** | 手写索引大约在第 40~50 题时开始漏更新，此后无法追赶 |
| 4 | **目录名全英文小写连字符，禁用中文与空格** | 中文路径在 GitHub、CI、Node 脚本、Git Bash 之间反复出现编码问题，是经典翻车点 |
| 5 | **分类编号一经分配永不重排** | 重排使 git 历史塞满 rename，`git log --follow` 断裂 |
| 6 | **不要只 commit AC 代码** | 半年后能看懂代码，却看不懂当时为什么这么想。**笔记才是仓库的复利来源** |
| 7 | **Windows 路径长度限制** | 深层分类 + 长英文题名可能超 260 字符，故 slug 限长 40 字符 |
| 8 | **不提交 `.class` / `target/` / `.idea/` 与截图 PDF** | 控制仓库体积与 diff 噪音，`.gitignore` 中配好 |
| 9 | **必须配置 `.gitattributes`** | Windows 换行符 CRLF 会导致 diff 出现整文件「改动」，跨设备编辑时首次中招 |
| 10 | **必须有 LICENSE** | 无 License 默认「保留所有权利」，他人（含面试官）**不能合法复用**代码。作品集仓库建议 MIT |
| 11 | **Java 代码绝不写 `package` 声明** | 写了 LeetCode 提交直接报错 |
| 12 | **编译检查须逐目录执行** | 几十个文件同叫 `class Solution`，合并编译必然冲突 |
| 13 | **不预建 18 个空目录** | git 不追踪空目录，且空壳目录观感像烂尾项目 |
| 14 | **持续性靠降低摩擦，不靠意志力** | 把「最小可交付」压到 **1 题 / 15 分钟**（填 3 行思路也算完成）。**明确允许提交半成品**，周末集中补厚。目标是坚持 300 天，不是前两周很猛 |

第 14 条将作为**显式规则**写入仓库 README（或 `docs/`），因为「每天一道」类计划最常见的死法是第 3 周目标过高后彻底断更。

---

## 10. 提交信息规范

```
solve(lc-0001): 两数之和 - 哈希表一次遍历
notes(lc-0001): 补充解法演进与踩坑记录
chore(index): 重新生成索引
```

格式 `<type>(<scope>): <描述>`，scope 使用题号。收益：`git log --grep lc-0001` 能一次捞出**该题的全部历史**（含后续修订）。

约定 type：`solve`（新增解题）/ `notes`（笔记更新）/ `refactor`（重写解法）/ `chore`（索引、脚手架、配置）。

---

## 11. 落地计划

| 阶段 | 内容 | 耗时 |
|---|---|---|
| **0. 初始化** | 目录骨架、`categories.yml`、`docs/TEMPLATE.md`、两个脚本 + lib、`check-compile.mjs`、README/LICENSE/.gitignore/.gitattributes、`git init` + 首次提交 | 约 1 小时 |
| **1. 日常使用** | `new-problem` → 填笔记 → `build-index` → commit | 每天约 15 分钟 |
| **2. 可选增强** | `--fetch` 联网拉题、GitHub Actions 编译检查 + `build-index --check`、连续打卡统计 | 后续按需 |

### 11.1 已定的落地细节

| 事项 | 决定 |
|---|---|
| 远程仓库创建 | **网页创建**（`gh` CLI 未安装，不为一次性操作引入工具依赖），仓库名 `leetcode-java`，公开，**不加** README/LICENSE 初始化模板（本地已有，避免首次 pull 冲突） |
| `docs/specs/` 是否公开 | **保留公开** —— 体现工程过程，且 `categories.yml` 的意图需要文档解释 |
| README 顶部手写区内容 | 三段：① 仓库简介与定位 ② 「最小可交付 = 1 题 / 15 分钟，允许提交半成品」的持续性规则（注意点 14） ③ 如何新增一道题（指向脚手架命令） |

---

## 12. 验证策略

| 对象 | 验证方式 |
|---|---|
| `frontmatter.mjs` | 单元测试：正常字段、单行数组、非法嵌套、缺字段、空正文 |
| `build-index.mjs` | 基于临时 fixture 目录的测试：正常题目、category 与目录不一致、缺必填字段、重复 id |
| `new-problem.mjs` | 测试：合法创建、题号重复、非法标签、目录已存在（须不覆盖） |
| `check-compile.mjs` | 用「可编译」与「故意写错」的样例各一个验证 |
| 端到端 | 初始化后真实创建一道题（如 lc-0001）走完整流程，确认索引正确生成、代码可编译 |

说明：**不测题目解法本身**（用户明确不要每题测试），只测工具链。这条边界是刻意的。

### 12.1 测试运行器与位置

| 项 | 决定 |
|---|---|
| 运行器 | Node 内置 `node:test` + `node:assert/strict` |
| 依赖 | **零 npm 依赖** —— 与 §5.2「刷题仓库不该出现 node_modules」的原则一致 |
| 位置 | `tools/tests/*.test.mjs` |
| 命令 | `node --test tools/tests/` |
| fixture | 建在系统临时目录，测试结束清理，不污染仓库工作区 |

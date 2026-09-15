# leetcode-java 仓库实施计划

> **状态：已全部执行完成（2026-09-15）。** 61 个工具链测试全绿；端到端验证通过
> （脚手架建题 → 填内容 → 索引生成 → 逐目录编译检查 → `--check` 通过）。
> 实现过程中发现 8 项设计初稿未覆盖的问题，已记录于设计文档 §13。
> 下方 `- [ ]` 保留为执行时的原始清单，未回填勾选。

> **For agentic workers:** REQUIRED SUB-SKILL: 按任务顺序执行，每步用 `- [ ]` 勾选。设计契约细节见 `docs/specs/2026-09-15-leetcode-java-repo-design.md`（下称「设计文档 §N」），本文件只展开执行顺序与验收标准。

**Goal:** 把已评审的设计落地成一个可日常使用的刷题仓库：分类归档 + 零依赖 Node 工具链 + 自动索引。

**Architecture:** `problems/` 是唯一真相源（题目的 README front-matter 承载元数据）；`categories.yml` 是分类与标签的白名单；三支 Node 脚本分别负责「创建题目骨架 / 派生索引 / 编译检查」。索引永远单向派生，脚本只改写 `AUTO-GENERATED` 标记区间。

**Tech Stack:** Node.js v26（零 npm 依赖，用内置 `node:test`）、Java 21（`javac`）、Git 2.54。

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `categories.yml` | 唯一真相源：18 个分类 + 受控标签词表 |
| `docs/TEMPLATE.md` | 笔记模板，**脚手架唯一模板来源**（脚本内不得内嵌副本） |
| `tools/lib/frontmatter.mjs` | 零依赖 front-matter 解析/序列化（只支持扁平键值 + 单行数组） |
| `tools/lib/categories.mjs` | 解析并校验 `categories.yml` |
| `tools/lib/paths.mjs` | 仓库根定位、题目目录枚举与目录名解析 |
| `tools/lib/util.mjs` | `localDate()`、`slugify()`、题号补零 |
| `tools/new-problem.mjs` | 脚手架：校验 + 建目录 + 生成两个文件 |
| `tools/build-index.mjs` | 扫描题目 → 生成 README 与 INDEX-BY-TAG 的标记区间 |
| `tools/check-compile.mjs` | 逐题目录单独 `javac` |
| `tools/tests/*.test.mjs` | `node --test` 测试（只测工具链，不测题解） |
| `README.md` | 手写区 + `AUTO-GENERATED` 标记区 |
| `INDEX-BY-TAG.md` | 全自动生成 |

---

## Task 1: 仓库基础配置

**Files:** Create `.gitattributes`, `.gitignore`, `LICENSE`

- [ ] **Step 1:** 写 `.gitattributes`（内容见设计文档 §11.2）。**必须最先做** —— 前两次提交 git 都已警告 `LF will be replaced by CRLF`。
- [ ] **Step 2:** 写 `.gitignore`（内容见设计文档 §11.2）。
- [ ] **Step 3:** 写 MIT `LICENSE`（版权人 `bkonw`，年份 2026）。
- [ ] **Step 4: 验证** —— 运行 `git check-attr text eol -- docs/specs/2026-09-15-leetcode-java-repo-design.md`
  - 预期：`text: auto`、`eol: lf`
- [ ] **Step 5: 提交** —— `git add -A && git commit -m "chore: 添加 .gitattributes/.gitignore/LICENSE"`

## Task 2: categories.yml

**Files:** Create `categories.yml`

- [ ] **Step 1:** 按设计文档 §5.1 写死 18 个分类与 58 个标签（编号 01–18，编号永不重排）。
- [ ] **Step 2: 验证** —— 用 Task 5 的 `categories.mjs` 加载后断言 `categories.length === 18`、`tags.length === 58`、两者各自无重复。

## Task 3: docs/TEMPLATE.md

**Files:** Create `docs/TEMPLATE.md`

- [ ] **Step 1:** 按设计文档 §5.3 写模板，front-matter 含示例值（`lc-0001` / `两数之和`）。
- [ ] **Step 2:** 模板内含一行 HTML 注释说明「front-matter 只允许扁平键值与单行数组」，使规范随模板一起被人看到。
- [ ] **Step 3: 验证** —— `parseFrontmatter` 能解析该模板的 front-matter，`errors` 为空。

## Task 4: frontmatter.mjs（TDD）

**Files:** Create `tools/lib/frontmatter.mjs`, `tools/tests/frontmatter.test.mjs`

接口：`parseFrontmatter(text) → { data, body, errors }`；`stringifyFrontmatter(data) → string`

- [ ] **Step 1: 写失败测试** —— 用例：
  1. 正常扁平字段 + 单行数组 → `data.tags` 为 `['数组','哈希表']`
  2. 值含冒号（`url: https://...`）→ 只在**第一个**冒号处分割
  3. 无 front-matter（不以 `---` 开头）→ `data` 为空、`errors` 非空
  4. 未闭合（缺结束 `---`）→ `errors` 非空
  5. 嵌套（`key:` 后跟缩进行）→ `errors` 非空
  6. 块标量（值以 `|` 或 `>` 开头）→ `errors` 非空
  7. 空数组 `tags: []` → `data.tags` 为 `[]`
  8. `body` 不含 front-matter 部分
- [ ] **Step 2: 跑测试确认失败** —— `node --test tools/tests/frontmatter.test.mjs`，预期 `ERR_MODULE_NOT_FOUND`
- [ ] **Step 3: 实现** —— 逐行解析，仅两种形态：`key: value`、`key: [a, b, c]`。记录 `errors` 而**不抛异常**（由调用方决定致命性）。
- [ ] **Step 4: 跑测试确认通过** —— 预期 8 个用例全 PASS
- [ ] **Step 5: 提交** —— `feat(tools): 零依赖 front-matter 解析器`

## Task 5: util / paths / categories（TDD）

**Files:** Create `tools/lib/util.mjs`, `tools/lib/paths.mjs`, `tools/lib/categories.mjs`, `tools/tests/categories.test.mjs`

- [ ] **Step 1: 写失败测试** —— `localDate` 用固定 `Date` 断言输出本地日期（**回归测试：禁止 UTC**，用 `new Date(2026, 0, 2, 3, 0, 0)` 断言 `2026-01-02`，若误用 `toISOString` 会得到 `2026-01-01`）；`categories` 加载后 18/58 且无重复；目录名解析 `lc-0001-two-sum → { num: 1, slug: 'two-sum' }`。
- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现**
  - `util.mjs`：`localDate(d)`（用 `getFullYear/getMonth/getDate`）、`slugify(s)`、`padNum(n)`（≥4 位左补零）
  - `paths.mjs`：`repoRoot(override)`、`listProblemDirs(root)`、`parseProblemDirName(name)`
  - `categories.mjs`：`loadCategories(root)` → `{ categories, tags, errors }`，行级解析（`categories:` / `tags:` 段，`- { id: X, name: Y }` 与 `- TAG`）
- [ ] **Step 4: 跑测试确认通过**
- [ ] **Step 5: 提交**

## Task 6: new-problem.mjs（TDD）

**Files:** Create `tools/new-problem.mjs`, `tools/tests/new-problem.test.mjs`

CLI 与默认值见设计文档 §6.1。新增 `--root <dir>` 便于测试指向 fixture。

- [ ] **Step 1: 写失败测试**（在临时目录建最小 fixture：`categories.yml` + `docs/TEMPLATE.md`）：
  1. 合法参数 → 建出目录，`README.md` 的 front-matter 各字段正确、`status` 默认 `独立完成`、`--date` 默认今天
  2. 题号重复 → 退出码 1，且**原目录内容未被改动**
  3. 非法标签 → 退出码 1，错误信息含该标签
  4. 非法分类 → 退出码 1
  5. 目录已存在 → 退出码 1，**不覆盖**
  6. 缺 `--slug` → 退出码 2
  7. 绝对路径超 240 → 退出码 1
  8. `--dry-run` → 不建任何文件，退出码 0
- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现** —— 解析参数 → 校验 → 读 `docs/TEMPLATE.md` 替换 front-matter 值 → 写两个文件。**模板必须从文件读取，不得内嵌副本。**
- [ ] **Step 4: 跑测试确认通过**
- [ ] **Step 5: 提交**

## Task 7: build-index.mjs（TDD）

**Files:** Create `tools/build-index.mjs`, `tools/tests/build-index.test.mjs`

CLI 见设计文档 §6.2。新增 `--root`。

- [ ] **Step 1: 写失败测试**：
  1. 正常一道题 → README 标记区间内含该题，**题名为相对 Markdown 链接**
  2. 空仓库 → 18 个分类全部出现且计数为 0
  3. `category` 与目录不符 → 退出码 1，错误信息同时含两个值
  4. 缺必填字段 → 退出码 1
  5. 重复 `id` → 退出码 1
  6. **幂等**：连跑两次，第二次不修改文件（比较 mtime 与内容）
  7. **标记缺失 → 退出码 1，且文件内容完全未变**（防冲掉手写区）
  8. 多标签题 → 在 `INDEX-BY-TAG.md` 的多个标签下各出现一次
  9. `--check` → 不写文件
- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现** —— 扫描 → 校验 → 渲染 → 仅替换标记区间 → 内容不变则不写盘。
- [ ] **Step 4: 跑测试确认通过**
- [ ] **Step 5: 提交**

## Task 8: check-compile.mjs

**Files:** Create `tools/check-compile.mjs`

- [ ] **Step 1: 实现** —— 遍历全部题目录，**逐个**执行 `javac`，产物输出到系统临时目录并在结束后清理。
  - 关键实现选择：用 `spawnSync('javac', files, { stdio: ['ignore','inherit','inherit'] })` 并只看退出码。**刻意不捕获 stdout/stderr** —— javac 成功时本就静默，失败时原文直接打到终端（比二次包装的摘要更有用），同时避开管道式 stdio 在受限环境下的 `EPERM`。
- [ ] **Step 2: 验证（正向）** —— 对 Task 5 的可编译样例运行，预期退出码 0、无输出
- [ ] **Step 3: 验证（反向）** —— 临时放入故意写错的 `.java`，预期退出码 1 且打印 javac 原始错误；随后删除该临时文件
- [ ] **Step 4: 提交**

## Task 9: README.md 与 INDEX-BY-TAG.md 骨架

**Files:** Create `README.md`, `INDEX-BY-TAG.md`

- [ ] **Step 1:** 写 `README.md` 手写区四段（设计文档 §11.1）：① 简介与定位 ② 持续性规则（最小可交付 1 题/15 分钟、允许提交半成品） ③ 如何新增一道题 ④ 指向 `docs/specs/`
- [ ] **Step 2:** 在两个文件里放好 `<!-- AUTO-GENERATED:START -->` / `<!-- AUTO-GENERATED:END -->` 标记
- [ ] **Step 3: 验证** —— 跑 `build-index.mjs`，两个文件的标记区间被填充，手写区逐字未变
- [ ] **Step 4: 提交**

## Task 10: 端到端验证

- [ ] **Step 1:** 用真实脚手架创建 `lc-0001 两数之和`（放进 `01-array-hash`）
- [ ] **Step 2:** 填入真实的 AC 解法与思路笔记（替换模板示例内容）
- [ ] **Step 3:** 跑 `node --test "tools/tests/*.test.mjs"` → 预期 53 个用例全绿（目录形式 `tools/tests/` 会因 `ERR_UNSUPPORTED_DIR_IMPORT` 失败，不要用）
- [ ] **Step 4:** 跑 `node tools/build-index.mjs` → 索引出现该题且链接可点
- [ ] **Step 5:** 跑 `node tools/check-compile.mjs` → 退出码 0
- [ ] **Step 6:** 跑 `node tools/build-index.mjs --check` → 退出码 0
- [ ] **Step 7:** 提交 —— `solve(lc-0001): 两数之和 - 哈希表一次遍历`

## Task 11: 推送 GitHub

- [ ] **Step 1:** 在 GitHub 网页创建**空的**公开仓库 `leetcode-java`（**不要**勾选 README/LICENSE/.gitignore，避免首次 pull 冲突）
- [ ] **Step 2:** `git remote add origin <url>` → `git push -u origin main`
- [ ] **Step 3:** 确认网页上 front-matter 渲染成信息表格、README 索引链接可点

---

## 自检

**1. 设计文档覆盖检查**

| 设计文档章节 | 对应任务 |
|---|---|
| §4 目录结构 / §4.1 命名 | Task 1、6 |
| §4.2 不预建空目录 | Task 1（无空目录任务，符合） |
| §5.1 categories.yml | Task 2、5 |
| §5.2 front-matter 字段 | Task 3、4、6 |
| §5.3 模板 | Task 3 |
| §5.4 一题多解 | Task 3（模板不含独立文件生成）、Task 8（逐目录编译） |
| §5.5 入库准则 | Task 9（README 写明）、Task 6（status 默认 `独立完成`） |
| §6.1 脚手架 | Task 6 |
| §6.2 索引 | Task 7 |
| §6.3 编译检查 | Task 8 |
| §6.4 解析库 | Task 4 |
| §7 数据流 | Task 10 端到端 |
| §8 错误处理 | Task 6、7 的测试用例逐条覆盖 |
| §9 注意事项 1/2/4/5/8/9/10 | Task 1、2、3、6 |
| §9 注意点 15（本地日期） | Task 5 回归测试 |
| §10 提交规范 | 各 Task 的 commit 步骤 |
| §11.1 落地细节 | Task 1、9、11 |
| §11.2 配置文件内容 | Task 1 |
| §12 验证策略 | Task 4–8 的测试 + Task 10 端到端 |

无遗漏项。

**2. 占位符扫描** —— 无 TBD / TODO / 「类似 Task N」；所有代码步骤都指向设计文档的具体章节，或在本文件内给出完整策略。

**3. 命名一致性** —— 全程统一使用：`parseFrontmatter` / `stringifyFrontmatter`、`loadCategories`、`localDate`、`listProblemDirs`、`parseProblemDirName`、`--root`、`AUTO-GENERATED:START|END`、退出码 `0/1/2`。

## 已知风险与预案

| 风险 | 预案 |
|---|---|
| 受限环境禁止 Node 通过管道捕获子进程输出 | Task 8 已选择 `stdio: inherit` 方案，**不使用管道**，天然规避 |
| `javac` 在 PATH 中不可用 | Task 8 失败时明确提示「未找到 javac」，退出码 1 |
| Git 写入 `.git` 被沙箱拦截 | 本会话已确认需提权执行 git 提交 |

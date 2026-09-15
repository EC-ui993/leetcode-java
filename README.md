# leetcode-java

用 Java 刷 LeetCode 的题解记录。按**用到的算法分类归档**，每题一份思路笔记。

这个仓库的定位是「先服务自己的复习，但结构按作品集标准搭」：笔记写中文方便自己回看，
目录与元数据用英文规范，方便检索、脚本处理与面试官阅读。

- 📁 题目在 [`problems/`](problems/)，按算法分类存放
- 🔖 按标签交叉检索见 [`INDEX-BY-TAG.md`](INDEX-BY-TAG.md)
- 🧭 分类与标签的完整清单见 [`categories.yml`](categories.yml)
- 📐 设计文档（为什么这么组织）见 [`docs/specs/`](docs/specs/)

## 这个仓库的规矩

### 1. 只有 AC 过的代码才入库

正确性由 LeetCode 判定，仓库只记录结论——所以这里没有单元测试。
`status` 字段如实标注可信度，它是这个仓库最不能糊弄的一项：

| `status` | 含义 |
|---|---|
| `独立完成` | 没看题解，自己 AC |
| `看题解完成` | 参考题解后 AC |
| `未通过` | 还没 AC，如实标注（**不允许为了好看改掉**） |

### 2. 最小可交付 = 1 题 / 15 分钟

目标是坚持 300 天，不是前两周很猛。**允许提交半成品**——笔记只写了三行思路也算完成。
但「半成品」指的是笔记单薄，**不是代码不能编译**。

忙的时候，只填「思路」一节就够了，周末再集中补厚。

### 3. 笔记比代码重要

半年后你能看懂代码，但看不懂当时为什么这么想。所以模板里有「解法演进」和「踩坑」两节，
那才是这个仓库的复利来源。

## 怎么新增一道题

```bash
node tools/new-problem.mjs --id 1 --title "两数之和" --slug two-sum \
    --cat 01-array-hash --tags 数组,哈希表 --difficulty Easy
```

- `--title` 是**中文题名**（写进笔记），`--slug` 是 LeetCode URL 里的英文 slug（决定目录名）
- `--cat` 可从 [`categories.yml`](categories.yml) 查；`--tags` 必须是标签词表内的
- 不确定参数时加 `--dry-run` 先看看会建什么

然后：

```bash
# 1. 填笔记与代码
#    problems/01-array-hash/lc-0001-two-sum/README.md
#    problems/01-array-hash/lc-0001-two-sum/Solution.java

# 2. 刷新索引（也可以直接跑，索引没变化时不会写盘）
node tools/build-index.mjs

# 3. 提交
git add -A && git commit -m "solve(lc-0001): 两数之和 - 哈希表一次遍历"
```

其他工具：

```bash
node tools/build-index.mjs --check    # 校验元数据 + 检查索引是否过期；不写盘（CI / 提交前）
node tools/check-compile.mjs          # 每个题目录单独 javac，确认代码还能编译
node --test "tools/tests/*.test.mjs"  # 工具链自身的测试（零 npm 依赖）
```

> ⚠️ 测试命令**不要**写成 `node --test tools/tests/`：Node 会把目录当成模块去 import，
> 报 `ERR_UNSUPPORTED_DIR_IMPORT`。必须给 glob 模式（或显式文件列表）。

> 小提示：如果要把输出重定向到文件，Windows 上先执行 `chcp 65001` 切到 UTF-8，
> 否则中文可能显示为乱码。

## 踩过的坑（Windows）

都是实际撞到过的，记下来省得再查一遍。

| 现象 | 真正的原因 | 怎么办 |
|---|---|---|
| javac 报 `illegal character: '\ufeff'` | `.java` 存成了 **UTF-8 with BOM**。Windows 编辑器默认就可能加 BOM | 另存为「UTF-8 无 BOM」。`check-compile.mjs` 会提前拦截并提示 |
| 编译报错信息是乱码 | javac 按系统区域输出本地化诊断（GBK），终端按 UTF-8 读 | 无需处理：`check-compile.mjs` 已固定传 `-J-Duser.language=en` 强制英文诊断 |
| `node --test tools/tests/` 失败 | Node 把目录当模块 `import` | 用 `node --test "tools/tests/*.test.mjs"` |
| `Get-Content xxx.md` 显示成乱码 | PowerShell 5.1 的 `Get-Content` 默认按 ANSI 解读 UTF-8 文件 | 文件没坏。要用 `[System.IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)` 才准 |
| git 提示 `LF will be replaced by CRLF` | Windows 换行符 | 已由 `.gitattributes` 统一为 LF |

## 贡献

这是个人刷题记录，所以是 MIT 许可、欢迎参考，但一般不接受 PR。
发现笔记里有错的地方，欢迎开 issue 告诉我。

<!-- AUTO-GENERATED:START -->
## 进度

**共 1 题** ｜ Easy 1 · Medium 0 · Hard 0 ｜ 最近 AC：2026-09-15

## 分类总览

| 分类 | 题数 | 分类 | 题数 |
|---|---:|---|---:|
| 数组与哈希表 (`01-array-hash`) | 1 | 动态规划 (`10-dynamic-programming`) | 0 |
| 双指针 (`02-two-pointers`) | 0 | 贪心 (`11-greedy`) | 0 |
| 滑动窗口 (`03-sliding-window`) | 0 | 堆与优先队列 (`12-heap`) | 0 |
| 二分查找 (`04-binary-search`) | 0 | 字典树 (`13-trie`) | 0 |
| 栈与队列 (`05-stack-queue`) | 0 | 并查集 (`14-union-find`) | 0 |
| 链表 (`06-linked-list`) | 0 | 位运算 (`15-bit-manipulation`) | 0 |
| 二叉树 (`07-binary-tree`) | 0 | 数学 (`16-math`) | 0 |
| 图论 (`08-graph`) | 0 | 字符串 (`17-string`) | 0 |
| 回溯 (`09-backtracking`) | 0 | 设计题 (`18-design`) | 0 |

## 题目索引

### 数组与哈希表（1）

| 题号 | 题名 | 难度 | 标签 | 状态 | 日期 |
|---|---|---|---|---|---|
| 0001 | [两数之和](problems/01-array-hash/lc-0001-two-sum/README.md) | Easy | 数组、哈希表 | 独立完成 | 2026-09-15 |
<!-- AUTO-GENERATED:END -->

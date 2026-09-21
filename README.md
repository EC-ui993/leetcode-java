# leetcode-java

用 Java 刷 LeetCode 的记录。题目按**算法分类归档**，每题一份思路笔记。

定位：先服务自己的复习，结构上按作品集标准搭——笔记写中文方便回看，
目录与元数据用英文规范，方便检索、脚本处理，也方便别人读懂。

- 📁 题目在 [`problems/`](problems/)，按算法分类存放
- 🔖 按标签交叉检索见 [`INDEX-BY-TAG.md`](INDEX-BY-TAG.md)
- 🧭 分类与标签的完整清单见 [`categories.yml`](categories.yml)
- 🎯 题单清单（Hot 100 等）见 [`lists/`](lists/)
- 📐 设计文档（为什么这么组织）见 [`docs/specs/`](docs/specs/)

## 几条自我约定

### 1. 只收 AC 过的代码

正确性交给 LeetCode 判定，这里只记录结论——所以仓库里没有单元测试。
`status` 如实标注每份代码的来源，这是整个记录里最不能含糊的一项：

| `status` | 含义 |
|---|---|
| `独立完成` | 没看题解，自己 AC |
| `看题解完成` | 参考题解后 AC |
| `未通过` | 还没 AC，如实标注 |

### 2. 最小可交付 = 1 题 / 15 分钟

要的是坚持 300 天，不是前两周很猛。笔记只写了三行思路也算完成一道。
但「半成品」只指笔记单薄——**代码必须能编译**。

忙的时候只填「思路」一节，周末再集中补厚。

### 3. 笔记比代码重要

代码半年后还看得懂，但「当时为什么这么想」会忘干净。
所以笔记里有「解法演进」和「踩坑」两节——它们才是这个仓库真正攒下来的东西。

## 新增一道题

```bash
node tools/new-problem.mjs --id 1 --title "两数之和" --slug two-sum \
    --cat 01-array-hash --tags 数组,哈希表 --difficulty Easy
```

- `--title` 是**中文题名**（写进笔记），`--slug` 是 LeetCode URL 里的英文 slug（决定目录名）
- `--cat` 从 [`categories.yml`](categories.yml) 里选；`--tags` 必须是词表内的标签
- 拿不准参数就先加 `--dry-run` 空跑一遍

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

两个记过一次的坑：

- 测试命令不能用目录形式 `node --test tools/tests/`——Node 会把目录当模块 import，
  报 `ERR_UNSUPPORTED_DIR_IMPORT`，必须给 glob 模式
- 输出重定向到文件时先 `chcp 65001`，否则中文按 GBK 解读会变乱码

## 踩过的坑（Windows）

都是实际撞到过的，记下来省得再查一遍。

| 现象 | 真正的原因 | 怎么办 |
|---|---|---|
| javac 报 `illegal character: '\ufeff'` | `.java` 存成了 **UTF-8 with BOM**。Windows 编辑器默认就可能加 BOM | 另存为「UTF-8 无 BOM」。`check-compile.mjs` 会提前拦截并提示 |
| 编译报错信息是乱码 | javac 按系统区域输出本地化诊断（GBK），终端按 UTF-8 读 | 无需处理：`check-compile.mjs` 已固定传 `-J-Duser.language=en` 强制英文诊断 |
| `node --test tools/tests/` 失败 | Node 把目录当模块 `import` | 用 `node --test "tools/tests/*.test.mjs"` |
| `Get-Content xxx.md` 显示成乱码 | PowerShell 5.1 的 `Get-Content` 默认按 ANSI 解读 UTF-8 文件 | 文件没坏。要用 `[System.IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)` 才准 |
| git 提示 `LF will be replaced by CRLF` | Windows 换行符 | 已由 `.gitattributes` 统一为 LF |
| VS Code 报 `Solution.java is a non-project file` | 每个 `Solution.java` 都是独立可提交的单元，仓库刻意不是 Java 工程 | 正常现象，忽略即可 |
| javac 报 `duplicate class: Solution` | 同一题目录下两个文件都声明了 `class Solution` | 备选解的类名改成 `SolutionAlt` |

## 关于

个人刷题记录，MIT 许可。欢迎参考，但一般不接受 PR。
笔记里有错的地方，欢迎开 issue。

<!-- AUTO-GENERATED:START -->
## 进度

**已完成 8 题** ｜ Easy 3 · Medium 5 · Hard 0 ｜ 最近 AC：2026-09-21

## 力扣热题 HOT 100 进度

**6 / 100**（6%）

### 已完成（6）

| 题号 | 题名 | 难度 | 状态 |
|---|---|---|---|
| 0001 | [两数之和](problems/01-array-hash/lc-0001-two-sum/README.md) | Easy | 独立完成 |
| 0049 | [字母异位词分组](problems/01-array-hash/lc-0049-group-anagrams/README.md) | Medium | 看题解完成 |
| 0128 | [最长连续序列](problems/01-array-hash/lc-0128-longest-consecutive-sequence/README.md) | Medium | 看题解完成 |
| 0283 | [移动零](problems/02-two-pointers/lc-0283-move-zeroes/README.md) | Easy | 独立完成 |
| 0011 | [盛最多水的容器](problems/02-two-pointers/lc-0011-container-with-most-water/README.md) | Medium | 看题解完成 |
| 0015 | [三数之和](problems/02-two-pointers/lc-0015-3sum/README.md) | Medium | 看题解完成 |

<details>
<summary>全部 100 道清单</summary>

| 题号 | 题名 | 难度 | 笔记 |
|---|---|---|---|
| 0001 | 两数之和 | Easy | [✅ 已做](problems/01-array-hash/lc-0001-two-sum/README.md) |
| 0049 | 字母异位词分组 | Medium | [✅ 已做](problems/01-array-hash/lc-0049-group-anagrams/README.md) |
| 0128 | 最长连续序列 | Medium | [✅ 已做](problems/01-array-hash/lc-0128-longest-consecutive-sequence/README.md) |
| 0283 | 移动零 | Easy | [✅ 已做](problems/02-two-pointers/lc-0283-move-zeroes/README.md) |
| 0011 | 盛最多水的容器 | Medium | [✅ 已做](problems/02-two-pointers/lc-0011-container-with-most-water/README.md) |
| 0015 | 三数之和 | Medium | [✅ 已做](problems/02-two-pointers/lc-0015-3sum/README.md) |
| 0042 | 接雨水 | Hard |  |
| 0003 | 无重复字符的最长子串 | Medium |  |
| 0438 | 找到字符串中所有字母异位词 | Medium |  |
| 0560 | 和为 K 的子数组 | Medium |  |
| 0239 | 滑动窗口最大值 | Hard |  |
| 0076 | 最小覆盖子串 | Hard |  |
| 0053 | 最大子数组和 | Medium |  |
| 0056 | 合并区间 | Medium |  |
| 0189 | 轮转数组 | Medium |  |
| 0238 | 除了自身以外数组的乘积 | Medium |  |
| 0041 | 缺失的第一个正数 | Hard |  |
| 0073 | 矩阵置零 | Medium |  |
| 0054 | 螺旋矩阵 | Medium |  |
| 0048 | 旋转图像 | Medium |  |
| 0240 | 搜索二维矩阵 II | Medium |  |
| 0160 | 相交链表 | Easy |  |
| 0206 | 反转链表 | Easy |  |
| 0234 | 回文链表 | Easy |  |
| 0141 | 环形链表 | Easy |  |
| 0142 | 环形链表 II | Medium |  |
| 0021 | 合并两个有序链表 | Easy |  |
| 0002 | 两数相加 | Medium |  |
| 0019 | 删除链表的倒数第 N 个结点 | Medium |  |
| 0024 | 两两交换链表中的节点 | Medium |  |
| 0025 | K 个一组翻转链表 | Hard |  |
| 0138 | 随机链表的复制 | Medium |  |
| 0148 | 排序链表 | Medium |  |
| 0023 | 合并 K 个升序链表 | Hard |  |
| 0146 | LRU 缓存 | Medium |  |
| 0094 | 二叉树的中序遍历 | Easy |  |
| 0104 | 二叉树的最大深度 | Easy |  |
| 0226 | 翻转二叉树 | Easy |  |
| 0101 | 对称二叉树 | Easy |  |
| 0543 | 二叉树的直径 | Easy |  |
| 0102 | 二叉树的层序遍历 | Medium |  |
| 0108 | 将有序数组转换为二叉搜索树 | Easy |  |
| 0098 | 验证二叉搜索树 | Medium |  |
| 0230 | 二叉搜索树中第 K 小的元素 | Medium |  |
| 0199 | 二叉树的右视图 | Medium |  |
| 0114 | 二叉树展开为链表 | Medium |  |
| 0105 | 从前序与中序遍历序列构造二叉树 | Medium |  |
| 0437 | 路径总和 III | Medium |  |
| 0236 | 二叉树的最近公共祖先 | Medium |  |
| 0124 | 二叉树中的最大路径和 | Hard |  |
| 0200 | 岛屿数量 | Medium |  |
| 0994 | 腐烂的橘子 | Medium |  |
| 0207 | 课程表 | Medium |  |
| 0208 | 实现 Trie (前缀树) | Medium |  |
| 0046 | 全排列 | Medium |  |
| 0078 | 子集 | Medium |  |
| 0017 | 电话号码的字母组合 | Medium |  |
| 0039 | 组合总和 | Medium |  |
| 0022 | 括号生成 | Medium |  |
| 0079 | 单词搜索 | Medium |  |
| 0131 | 分割回文串 | Medium |  |
| 0051 | N 皇后 | Hard |  |
| 0035 | 搜索插入位置 | Easy |  |
| 0074 | 搜索二维矩阵 | Medium |  |
| 0034 | 在排序数组中查找元素的第一个和最后一个位置 | Medium |  |
| 0033 | 搜索旋转排序数组 | Medium |  |
| 0153 | 寻找旋转排序数组中的最小值 | Medium |  |
| 0004 | 寻找两个正序数组的中位数 | Hard |  |
| 0020 | 有效的括号 | Easy |  |
| 0155 | 最小栈 | Medium |  |
| 0394 | 字符串解码 | Medium |  |
| 0739 | 每日温度 | Medium |  |
| 0084 | 柱状图中最大的矩形 | Hard |  |
| 0215 | 数组中的第K个最大元素 | Medium |  |
| 0347 | 前 K 个高频元素 | Medium |  |
| 0295 | 数据流的中位数 | Hard |  |
| 0121 | 买卖股票的最佳时机 | Easy |  |
| 0055 | 跳跃游戏 | Medium |  |
| 0045 | 跳跃游戏 II | Medium |  |
| 0763 | 划分字母区间 | Medium |  |
| 0070 | 爬楼梯 | Easy |  |
| 0118 | 杨辉三角 | Easy |  |
| 0198 | 打家劫舍 | Medium |  |
| 0279 | 完全平方数 | Medium |  |
| 0322 | 零钱兑换 | Medium |  |
| 0139 | 单词拆分 | Medium |  |
| 0300 | 最长递增子序列 | Medium |  |
| 0152 | 乘积最大子数组 | Medium |  |
| 0416 | 分割等和子集 | Medium |  |
| 0032 | 最长有效括号 | Hard |  |
| 0062 | 不同路径 | Medium |  |
| 0064 | 最小路径和 | Medium |  |
| 0005 | 最长回文子串 | Medium |  |
| 1143 | 最长公共子序列 | Medium |  |
| 0072 | 编辑距离 | Medium |  |
| 0136 | 只出现一次的数字 | Easy |  |
| 0169 | 多数元素 | Easy |  |
| 0075 | 颜色分类 | Medium |  |
| 0031 | 下一个排列 | Medium |  |
| 0287 | 寻找重复数 | Medium |  |

</details>

## 分类总览

| 分类 | 题数 | 分类 | 题数 |
|---|---:|---|---:|
| 数组与哈希表 (`01-array-hash`) | 4 | 动态规划 (`10-dynamic-programming`) | 0 |
| 双指针 (`02-two-pointers`) | 4 | 贪心 (`11-greedy`) | 0 |
| 滑动窗口 (`03-sliding-window`) | 0 | 堆与优先队列 (`12-heap`) | 0 |
| 二分查找 (`04-binary-search`) | 0 | 字典树 (`13-trie`) | 0 |
| 栈与队列 (`05-stack-queue`) | 0 | 并查集 (`14-union-find`) | 0 |
| 链表 (`06-linked-list`) | 0 | 位运算 (`15-bit-manipulation`) | 0 |
| 二叉树 (`07-binary-tree`) | 0 | 数学 (`16-math`) | 0 |
| 图论 (`08-graph`) | 0 | 字符串 (`17-string`) | 0 |
| 回溯 (`09-backtracking`) | 0 | 设计题 (`18-design`) | 0 |

## 题目索引

### 数组与哈希表（4）

| 题号 | 题名 | 难度 | 标签 | 状态 | 日期 |
|---|---|---|---|---|---|
| 0001 | [两数之和](problems/01-array-hash/lc-0001-two-sum/README.md) | Easy | 数组、哈希表 | 独立完成 | 2026-09-15 |
| 0049 | [字母异位词分组](problems/01-array-hash/lc-0049-group-anagrams/README.md) | Medium | 哈希表、字符串、排序 | 看题解完成 | 2026-09-18 |
| 0128 | [最长连续序列](problems/01-array-hash/lc-0128-longest-consecutive-sequence/README.md) | Medium | 哈希集合、数组 | 看题解完成 | 2026-09-21 |
| 0242 | [有效的字母异位词](problems/01-array-hash/lc-0242-valid-anagram/README.md) | Easy | 哈希表、字符串、排序 | 看题解完成 | 2026-09-19 |

### 双指针（4）

| 题号 | 题名 | 难度 | 标签 | 状态 | 日期 |
|---|---|---|---|---|---|
| 0011 | [盛最多水的容器](problems/02-two-pointers/lc-0011-container-with-most-water/README.md) | Medium | 双指针、数组、贪心 | 看题解完成 | 2026-09-21 |
| 0015 | [三数之和](problems/02-two-pointers/lc-0015-3sum/README.md) | Medium | 双指针、数组、排序 | 看题解完成 | 2026-09-21 |
| 0167 | [两数之和 II - 输入有序数组](problems/02-two-pointers/lc-0167-two-sum-ii-input-array-is-sorted/README.md) | Medium | 双指针、数组 | 独立完成 | 2026-09-21 |
| 0283 | [移动零](problems/02-two-pointers/lc-0283-move-zeroes/README.md) | Easy | 双指针、数组、快慢指针 | 独立完成 | 2026-09-21 |
<!-- AUTO-GENERATED:END -->

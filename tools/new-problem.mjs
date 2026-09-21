#!/usr/bin/env node
/**
 * 脚手架：为一道已 AC 的题创建归档骨架。
 *
 * 设计：核心逻辑 runNewProblem(argv) 是纯函数（返回 {code, stdout, stderr}），
 * CLI 只是薄壳。这样测试可以直接调用逻辑，无需 spawn 子进程。
 *
 * 退出码：0 成功 / 1 校验失败 / 2 用法错误
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  repoRoot,
  problemsDir,
  templateFile,
  problemDirName,
  parseProblemDirName,
  listProblemDirs,
} from './lib/paths.mjs';
import { loadCategories } from './lib/categories.mjs';
import { parseFrontmatter, stringifyFrontmatter } from './lib/frontmatter.mjs';
import { localDate, slugify, padNum } from './lib/util.mjs';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['未开始', '独立完成', '看题解完成', '未通过'];
// 脚手架绝不替用户宣称「已完成」：默认是未开始，由你自己改成实际状态。
const DEFAULT_STATUS = '未开始';
const MAX_PATH = 240; // Windows 默认上限 260，留 20 字符余量
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const USAGE = `用法：
  node tools/new-problem.mjs --id <题号> --title <中文题名> --slug <英文slug> \\
      --cat <分类id> --tags <标签1,标签2> --difficulty <Easy|Medium|Hard> \\
      [--url <链接>] [--date YYYY-MM-DD] [--status <状态>] [--dry-run] [--root <仓库根>]

示例：
  node tools/new-problem.mjs --id 1 --title "两数之和" --slug two-sum \\
      --cat 01-array-hash --tags 数组,哈希表 --difficulty Easy

说明：
  --title 是中文题名（写入笔记），--slug 是 LeetCode URL 里的英文 slug（决定目录名）。
  两者独立，不可混用；slug 必须与 LeetCode 一致，脚本不做截断。

退出码：0 成功 / 1 校验失败 / 2 用法错误`;

const BOOLEAN_FLAGS = new Set(['dry-run', 'help']);

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    if (BOOLEAN_FLAGS.has(key)) {
      out[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      return { error: `参数 --${key} 缺少值` };
    }
    out[key] = value;
    i++;
  }
  return out;
}

function solutionSkeleton(data) {
  return `/*
 * ${data.id} ${data.title}
 * 分类：${data.category} | 难度：${data.difficulty} | 状态：${data.status} | 日期：${data.date}
 * 原题：${data.url}
 *
 * 思路：
 * 复杂度：时间 O(?)，空间 O(?)
 *
 * 两条铁律：
 *   1. 不要写 package 声明 —— 写了 LeetCode 提交会直接报错
 *   2. 备选解法若要独立保留，另建 SolutionAlt.java（类名 SolutionAlt）
 */
class Solution {
    // 在此粘贴 LeetCode 的方法签名与实现（保持可原样复制提交）
}
`;
}

/**
 * @returns {{ code: number, stdout: string, stderr: string }}
 */
export function runNewProblem(argv, opts = {}) {
  const stdout = [];
  const stderr = [];
  const out = (m = '') => stdout.push(m);
  const err = (m = '') => stderr.push(m);
  const done = (code) => ({
    code,
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
  });

  const args = parseArgs(argv);
  if (args.error) {
    err(`✗ ${args.error}`);
    err(USAGE);
    return done(2);
  }
  if (args.help || args._.length > 0) {
    out(USAGE);
    return done(args._.length > 0 && !args.help ? 2 : 0);
  }

  const root = repoRoot(args.root ?? opts.root);

  const { categories, tags: tagVocab, errors: catErrors } = loadCategories(root);
  if (catErrors.length > 0) {
    err('✗ categories.yml 有误：');
    catErrors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  const missing = ['id', 'title', 'slug', 'cat', 'tags', 'difficulty'].filter((k) => !args[k]);
  if (missing.length > 0) {
    err(`✗ 缺少必填参数：${missing.map((k) => `--${k}`).join(', ')}`);
    err(USAGE);
    return done(2);
  }

  const num = Number(args.id);
  if (!Number.isInteger(num) || num <= 0) {
    err(`✗ --id 必须是正整数，收到：${args.id}`);
    return done(2);
  }

  const slug = slugify(args.slug);
  if (!SLUG_RE.test(slug)) {
    err(`✗ --slug 只能由英文小写字母、数字与连字符组成，收到：${args.slug}`);
    return done(2);
  }

  const category = args.cat;
  if (!categories.some((c) => c.id === category)) {
    err(`✗ 非法分类 --cat ${category}`);
    err('合法分类：');
    categories.forEach((c) => err(`  ${c.id}  ${c.name}`));
    return done(1);
  }

  const tags = String(args.tags)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  if (tags.length === 0) {
    err('✗ --tags 至少需要 1 个标签');
    return done(1);
  }
  const badTags = tags.filter((t) => !tagVocab.includes(t));
  if (badTags.length > 0) {
    err(`✗ 非法标签：${badTags.join('、')}`);
    err('如确需新增，请先编辑 categories.yml 的 tags: 段落加入该标签。');
    err('（显式编辑是有意保留的摩擦，用于防止标签爆炸导致索引腐烂。）');
    return done(1);
  }

  if (!DIFFICULTIES.includes(args.difficulty)) {
    err(`✗ --difficulty 必须是 ${DIFFICULTIES.join(' / ')}，收到：${args.difficulty}`);
    return done(1);
  }

  const status = args.status ?? DEFAULT_STATUS;
  if (!STATUSES.includes(status)) {
    err(`✗ --status 必须是 ${STATUSES.join(' / ')}，收到：${args.status}`);
    return done(1);
  }

  const date = args.date ?? localDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    err(`✗ --date 必须是 YYYY-MM-DD，收到：${args.date}`);
    return done(1);
  }

  const url = args.url ?? `https://leetcode.cn/problems/${slug}/`;

  const existing = listProblemDirs(root).filter(
    (p) => parseProblemDirName(p.dirName)?.num === num,
  );
  if (existing.length > 0) {
    err(`✗ 题号 ${num} 已存在：${path.relative(root, existing[0].dir)}`);
    return done(1);
  }

  const dir = path.join(problemsDir(root), category, problemDirName(num, slug));
  if (fs.existsSync(dir)) {
    err(`✗ 目录已存在，拒绝覆盖：${path.relative(root, dir)}`);
    return done(1);
  }

  const readmePath = path.join(dir, 'README.md');
  const solutionPath = path.join(dir, 'Solution.java');
  for (const p of [readmePath, solutionPath]) {
    if (p.length > MAX_PATH) {
      err(`✗ 绝对路径超长（${p.length} > ${MAX_PATH} 字符）：${p}`);
      return done(1);
    }
  }

  const tplPath = templateFile(root);
  if (!fs.existsSync(tplPath)) {
    err(`✗ 找不到笔记模板：${tplPath}`);
    return done(1);
  }
  const { body, errors: tplErrors } = parseFrontmatter(fs.readFileSync(tplPath, 'utf8'));
  if (tplErrors.length > 0) {
    err('✗ 模板 front-matter 有误：');
    tplErrors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  const data = {
    id: `lc-${padNum(num)}`,
    title: args.title,
    category,
    tags,
    difficulty: args.difficulty,
    status,
    url,
    date,
  };
  // 剥离模板中的 HTML 注释：那些是「模板自身的规范说明」，不是笔记内容。
  // 说明留在 TEMPLATE.md 里紧挨着它描述的东西，生成笔记时不带出去。
  const bodyClean = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const renderedBody = bodyClean
    .replaceAll('{{id}}', data.id)
    .replaceAll('{{title}}', args.title);

  const readme = `${stringifyFrontmatter(data)}\n\n${renderedBody}\n`;
  const solution = solutionSkeleton(data);

  const relDir = path.relative(root, dir).split(path.sep).join('/');

  if (args['dry-run']) {
    out(`[dry-run] 将创建目录 ${relDir}`);
    out(`[dry-run]   README.md     (${readme.length} 字符)`);
    out(`[dry-run]   Solution.java (${solution.length} 字符)`);
    out('[dry-run] 未写入任何文件。');
    return done(0);
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(readmePath, readme, 'utf8');
  fs.writeFileSync(solutionPath, solution, 'utf8');

  out(`✓ 已创建 ${relDir}`);
  out('');
  out('下一步：');
  out(`  1. 填笔记：${relDir}/README.md`);
  out(`  2. 贴代码：${relDir}/Solution.java`);
  out('  3. 刷新索引：node tools/build-index.mjs');
  return done(0);
}

function main() {
  const { code, stdout, stderr } = runNewProblem(process.argv.slice(2));
  if (stdout) process.stdout.write(`${stdout}\n`);
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.exit(code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

#!/usr/bin/env node
/**
 * 索引生成：扫描 problems/ 下的题目笔记，派生两份索引。
 *
 *   README.md          按算法分类的索引 + 进度统计
 *   INDEX-BY-TAG.md    按标签的交叉索引（一道题可在多个标签下出现）
 *
 * 索引是**产物**，唯一真相源是各题目的 README front-matter。
 *
 * 退出码：0 成功 / 1 校验失败 / 2 用法错误
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { repoRoot, listProblemDirs, parseProblemDirName } from './lib/paths.mjs';
import { loadCategories } from './lib/categories.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { padNum } from './lib/util.mjs';
import { loadLists, listProgress } from './lib/lists.mjs';

const START = '<!-- AUTO-GENERATED:START -->';
const END = '<!-- AUTO-GENERATED:END -->';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['未开始', '独立完成', '看题解完成', '未通过'];
/** 这个状态表示「目录已建但题还没做完」，不计入任何进度。 */
const STATUS_PENDING = '未开始';
const REQUIRED_FIELDS = ['id', 'title', 'category', 'tags', 'difficulty', 'status', 'url', 'date'];

const USAGE = `用法：
  node tools/build-index.mjs [--check] [--dry-run] [--root <仓库根>]

选项：
  --check     只校验不写盘（供 CI / 提交前钩子使用）：既校验元数据合法性，
              也比对索引内容是否已过期（例如加了题却忘了重建索引）。有违规则退出码 1
  --dry-run   渲染并打印，但不写盘
  --root      指定仓库根（默认由脚本位置推导）

退出码：0 成功 / 1 校验失败 / 2 用法错误`;

function parseArgs(argv) {
  const out = { _: [] };
  const bools = new Set(['check', 'dry-run', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    if (bools.has(key)) {
      out[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) return { error: `参数 --${key} 缺少值` };
    out[key] = value;
    i++;
  }
  return out;
}

/** 收集并校验题目元数据。返回 { items, errors, warnings } */
function collectProblems(root, categories, tagVocab) {
  const items = [];
  const errors = [];
  const seenIds = new Map();

  for (const p of listProblemDirs(root)) {
    const rel = `${p.category}/${p.dirName}`;
    const parsed = parseProblemDirName(p.dirName);
    if (!parsed) {
      errors.push(`${rel}：目录名不合规，应为 lc-<题号>-<英文slug>`);
      continue;
    }
    if (!fs.existsSync(p.readme)) {
      errors.push(`${rel}：缺少 README.md`);
      continue;
    }

    const { data, errors: fmErrors } = parseFrontmatter(fs.readFileSync(p.readme, 'utf8'));
    if (fmErrors.length > 0) {
      fmErrors.forEach((e) => errors.push(`${rel}/README.md：${e}`));
      continue;
    }

    const missing = REQUIRED_FIELDS.filter((f) => data[f] === undefined);
    if (missing.length > 0) {
      errors.push(`${rel}/README.md：缺少必填字段 ${missing.join(', ')}`);
      continue;
    }

    const expectedId = `lc-${padNum(parsed.num)}`;
    if (data.id !== expectedId) {
      errors.push(
        `${rel}/README.md：id 与目录名不一致 —— 目录为 ${expectedId}，但 id 写的是 ${data.id}`,
      );
      continue;
    }
    if (data.category !== p.category) {
      errors.push(
        `${rel}/README.md：category 与实际所在目录不一致 —— 文件在 ${p.category}，但 category 写的是 ${data.category}`,
      );
      continue;
    }
    if (seenIds.has(data.id)) {
      errors.push(`${rel}/README.md：id ${data.id} 重复，另一处为 ${seenIds.get(data.id)}`);
      continue;
    }
    seenIds.set(data.id, rel);

    if (!DIFFICULTIES.includes(data.difficulty)) {
      errors.push(`${rel}/README.md：difficulty 非法（${data.difficulty}），应为 ${DIFFICULTIES.join(' / ')}`);
      continue;
    }
    if (!STATUSES.includes(data.status)) {
      errors.push(`${rel}/README.md：status 非法（${data.status}），应为 ${STATUSES.join(' / ')}`);
      continue;
    }
    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      errors.push(`${rel}/README.md：tags 必须是至少含 1 项的数组`);
      continue;
    }
    const badTags = data.tags.filter((t) => !tagVocab.includes(t));
    if (badTags.length > 0) {
      errors.push(`${rel}/README.md：标签不在词表内 —— ${badTags.join('、')}`);
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      errors.push(`${rel}/README.md：date 必须为 YYYY-MM-DD（${data.date}）`);
      continue;
    }

    items.push({
      num: parsed.num,
      slug: parsed.slug,
      category: p.category,
      relDir: `problems/${p.category}/${p.dirName}`,
      data,
    });
  }

  items.sort((a, b) => a.num - b.num);
  return { items, errors };
}

/**
 * ⚠️ 刻意不输出「生成时间」之类的字段：那会让每次运行的结果都不同，
 * 从而破坏幂等性（每次跑都产生无意义的 git diff）。
 * 「最近 AC」取的是题目数据本身的最大日期，是稳定值。
 */
/**
 * 渲染一个题单的进度区：顶部是进度与「已完成」表，下面折叠着完整清单。
 * 归属由题号推导（见 tools/lib/lists.mjs），题目本身不需要标注任何标签。
 */
function renderListBlock(items, list) {
  const progress = listProgress(list, items);
  const byNum = new Map(items.map((it) => [it.num, it]));

  const lines = [];
  lines.push(`## ${list.name} 进度`);
  lines.push('');
  lines.push(`**${progress.done.length} / ${progress.total}**（${progress.percent}%）`);
  lines.push('');

  if (progress.done.length > 0) {
    lines.push(`### 已完成（${progress.done.length}）`);
    lines.push('');
    lines.push('| 题号 | 题名 | 难度 | 状态 |');
    lines.push('|---|---|---|---|');
    for (const p of progress.done) {
      const it = byNum.get(p.num);
      lines.push(
        `| ${padNum(p.num)} | [${p.title}](${it.relDir}/README.md) | ${p.difficulty} | ${it.data.status} |`,
      );
    }
    lines.push('');
  }

  lines.push('<details>');
  lines.push(`<summary>全部 ${progress.total} 道清单</summary>`);
  lines.push('');
  lines.push('| 题号 | 题名 | 难度 | 笔记 |');
  lines.push('|---|---|---|---|');
  for (const p of list.problems) {
    const it = byNum.get(p.num);
    const note = it ? `[✅ 已做](${it.relDir}/README.md)` : '';
    lines.push(`| ${padNum(p.num)} | ${p.title} | ${p.difficulty} | ${note} |`);
  }
  lines.push('');
  lines.push('</details>');

  return lines.join('\n');
}

function renderReadmeBlock(items, categories, lists) {
  const lines = [];
  // 「未开始」的题目录已建但尚未做完，不计入进度与题单统计
  const doneItems = items.filter((it) => it.data.status !== STATUS_PENDING);
  const pendingItems = items.filter((it) => it.data.status === STATUS_PENDING);

  const byDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => [d, 0]));
  for (const it of doneItems) byDifficulty[it.data.difficulty]++;

  const dates = doneItems.map((it) => it.data.date).sort();

  lines.push('## 进度');
  lines.push('');
  if (items.length === 0) {
    lines.push('还没有题目。用下面的命令添加第一道：');
    lines.push('');
    lines.push('```bash');
    lines.push('node tools/new-problem.mjs --id 1 --title "两数之和" --slug two-sum \\');
    lines.push('    --cat 01-array-hash --tags 数组,哈希表 --difficulty Easy');
    lines.push('```');
  } else {
    const parts = [`**已完成 ${doneItems.length} 题**`];
    if (pendingItems.length > 0) parts.push(`未开始 ${pendingItems.length} 题`);
    parts.push(
      `Easy ${byDifficulty.Easy} · Medium ${byDifficulty.Medium} · Hard ${byDifficulty.Hard}`,
    );
    if (dates.length > 0) parts.push(`最近 AC：${dates[dates.length - 1]}`);
    lines.push(parts.join(' ｜ '));

    if (pendingItems.length > 0) {
      lines.push('');
      lines.push(
        `进行中：${pendingItems.map((it) => `\`${it.data.id}\` ${it.data.title}`).join('、')}`,
      );
    }
  }
  lines.push('');

  for (const list of lists) {
    lines.push(renderListBlock(doneItems, list));
    lines.push('');
  }

  const counts = new Map(categories.map((c) => [c.id, 0]));
  for (const it of items) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);

  lines.push('## 分类总览');
  lines.push('');
  lines.push('| 分类 | 题数 | 分类 | 题数 |');
  lines.push('|---|---:|---|---:|');
  const half = Math.ceil(categories.length / 2);
  for (let i = 0; i < half; i++) {
    const left = categories[i];
    const right = categories[i + half];
    const cell = (c) => (c ? `${c.name} (\`${c.id}\`) | ${counts.get(c.id)}` : ' | ');
    lines.push(`| ${cell(left)} | ${cell(right)} |`);
  }
  lines.push('');

  const nonEmpty = categories.filter((c) => (counts.get(c.id) ?? 0) > 0);
  if (nonEmpty.length > 0) {
    lines.push('## 题目索引');
    lines.push('');
    for (const c of nonEmpty) {
      const rows = items.filter((it) => it.category === c.id);
      lines.push(`### ${c.name}（${rows.length}）`);
      lines.push('');
      lines.push('| 题号 | 题名 | 难度 | 标签 | 状态 | 日期 |');
      lines.push('|---|---|---|---|---|---|');
      for (const it of rows) {
        const link = `[${it.data.title}](${it.relDir}/README.md)`;
        lines.push(
          `| ${padNum(it.num)} | ${link} | ${it.data.difficulty} | ${it.data.tags.join('、')} | ${it.data.status} | ${it.data.date} |`,
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd();
}

function renderTagBlock(items, tagVocab) {
  const used = new Map();
  for (const it of items) {
    for (const t of it.data.tags) {
      if (!used.has(t)) used.set(t, []);
      used.get(t).push(it);
    }
  }

  const lines = [];
  lines.push(`词表共 ${tagVocab.length} 个标签，当前已使用 ${used.size} 个。`);
  lines.push('');

  const ordered = tagVocab.filter((t) => used.has(t));
  if (ordered.length === 0) {
    lines.push('（尚无带标签的题目）');
    return lines.join('\n');
  }

  // 一道题有多个标签时会在多行出现 —— 这正是解决「一题多分类」的交叉索引
  for (const t of ordered) {
    const rows = used.get(t).slice().sort((a, b) => a.num - b.num);
    lines.push(`### ${t}（${rows.length}）`);
    lines.push('');
    for (const it of rows) {
      lines.push(`- [${it.data.title}](${it.relDir}/README.md) — \`${it.data.id}\` · ${it.data.difficulty}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

/** 只替换标记区间，返回 null 表示标记缺失（绝不整文件覆盖）。 */
function replaceBlock(text, inner, label, errors) {
  const s = text.indexOf(START);
  const e = text.indexOf(END);
  if (s === -1 || e === -1 || e < s) {
    errors.push(
      `${label}：找不到 ${START} 与 ${END} 标记。` +
        '为避免冲掉你手写的内容，脚本拒绝整文件覆盖 —— 请先补上这两个标记。',
    );
    return null;
  }
  return `${text.slice(0, s + START.length)}\n${inner}\n${text.slice(e)}`;
}

/**
 * @returns {{ code: number, stdout: string, stderr: string }}
 */
export function runBuildIndex(argv, opts = {}) {
  const stdout = [];
  const stderr = [];
  const out = (m = '') => stdout.push(m);
  const err = (m = '') => stderr.push(m);
  const done = (code) => ({ code, stdout: stdout.join('\n'), stderr: stderr.join('\n') });

  const args = parseArgs(argv);
  if (args.error) {
    err(`✗ ${args.error}`);
    err(USAGE);
    return done(2);
  }
  if (args.help) {
    out(USAGE);
    return done(0);
  }
  if (args._.length > 0) {
    err(`✗ 不支持位置参数：${args._.join(' ')}`);
    err(USAGE);
    return done(2);
  }

  const root = repoRoot(args.root ?? opts.root);

  const { categories, tags: tagVocab, errors: catErrors } = loadCategories(root);
  if (catErrors.length > 0) {
    err('✗ categories.yml 有误：');
    catErrors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  const { lists, errors: listErrors } = loadLists(root);
  if (listErrors.length > 0) {
    err('✗ lists/ 有误：');
    listErrors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  const { items, errors } = collectProblems(root, categories, tagVocab);

  const readmePath = path.join(root, 'README.md');
  const tagPath = path.join(root, 'INDEX-BY-TAG.md');

  const readmeSrc = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : null;
  const tagSrc = fs.existsSync(tagPath) ? fs.readFileSync(tagPath, 'utf8') : null;

  if (readmeSrc === null) errors.push(`找不到 ${path.relative(root, readmePath)}`);
  if (tagSrc === null) errors.push(`找不到 ${path.relative(root, tagPath)}`);

  if (errors.length > 0) {
    err(`✗ 校验失败（${errors.length} 项）：`);
    errors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  // 先渲染，再决定做什么 —— 这样 --check 也能比对索引是否已过期。
  // （早先 --check 在校验完元数据后就返回了，于是「加了新题但忘了重建索引」
  //   这个 CI 最该拦住的错误反而拿到绿灯，属于虚假通过。）
  const readmeOut = replaceBlock(
    readmeSrc,
    renderReadmeBlock(items, categories, lists),
    'README.md',
    errors,
  );
  const tagOut = replaceBlock(tagSrc, renderTagBlock(items, tagVocab), 'INDEX-BY-TAG.md', errors);
  if (errors.length > 0) {
    err(`✗ 校验失败（${errors.length} 项）：`);
    errors.forEach((e) => err(`  ${e}`));
    return done(1);
  }

  if (args.check) {
    const stale = [];
    if (readmeOut !== readmeSrc) stale.push('README.md');
    if (tagOut !== tagSrc) stale.push('INDEX-BY-TAG.md');
    if (stale.length > 0) {
      err(`✗ 索引已过期：${stale.join('、')} 与题目数据不一致。`);
      err('  通常是因为新增、修改或删除题目后忘了重建索引。');
      err('  修复：node tools/build-index.mjs');
      return done(1);
    }
    out(`✓ 校验通过：${items.length} 道题，元数据与目录结构一致，索引已是最新。`);
    return done(0);
  }

  if (args['dry-run']) {
    out('=== README.md（标记区间）===');
    out(readmeOut === readmeSrc ? '（无变化）' : readmeOut);
    out('');
    out('=== INDEX-BY-TAG.md（标记区间）===');
    out(tagOut === tagSrc ? '（无变化）' : tagOut);
    out('');
    out('[dry-run] 未写入任何文件。');
    return done(0);
  }

  let changed = 0;
  for (const [label, file, next, prev] of [
    ['README.md', readmePath, readmeOut, readmeSrc],
    ['INDEX-BY-TAG.md', tagPath, tagOut, tagSrc],
  ]) {
    if (next === prev) {
      out(`= ${label} 未变更（跳过写入）`);
      continue;
    }
    fs.writeFileSync(file, next, 'utf8');
    out(`✓ ${label} 已更新`);
    changed++;
  }
  out(`完成：${items.length} 道题，${changed} 个索引文件被更新。`);
  return done(0);
}

function main() {
  const { code, stdout, stderr } = runBuildIndex(process.argv.slice(2));
  if (stdout) process.stdout.write(`${stdout}\n`);
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.exit(code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

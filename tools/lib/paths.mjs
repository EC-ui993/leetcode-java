/**
 * 仓库路径定位与题目目录枚举。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { padNum } from './util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // tools/lib

/**
 * 仓库根目录。传入 override（来自 `--root`）时以它为准，便于测试指向 fixture。
 */
export function repoRoot(override) {
  return override ? path.resolve(override) : path.resolve(HERE, '..', '..');
}

export function problemsDir(root) {
  return path.join(root, 'problems');
}

export function categoriesFile(root) {
  return path.join(root, 'categories.yml');
}

export function templateFile(root) {
  return path.join(root, 'docs', 'TEMPLATE.md');
}

/**
 * 枚举 problems/<分类>/<题目>/ 两层目录。
 * 返回 [{ category, dirName, dir, readme }]
 */
export function listProblemDirs(root) {
  const base = problemsDir(root);
  if (!fs.existsSync(base)) return [];

  const out = [];
  for (const cat of fs.readdirSync(base, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    const catPath = path.join(base, cat.name);
    for (const prob of fs.readdirSync(catPath, { withFileTypes: true })) {
      if (!prob.isDirectory()) continue;
      const dir = path.join(catPath, prob.name);
      out.push({
        category: cat.name,
        dirName: prob.name,
        dir,
        readme: path.join(dir, 'README.md'),
      });
    }
  }
  return out;
}

/** 解析 `lc-0001-two-sum` → `{ num: 1, slug: 'two-sum' }`；不合规返回 null。 */
export function parseProblemDirName(name) {
  const m = /^lc-(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(name);
  if (!m) return null;
  return { num: Number(m[1]), slug: m[2] };
}

/** 由题号与 slug 组装目录名。与 parseProblemDirName 往返一致。 */
export function problemDirName(num, slug) {
  return `lc-${padNum(num)}-${slug}`;
}

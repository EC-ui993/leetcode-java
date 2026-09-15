/**
 * 解析并校验 categories.yml —— 分类与标签的双白名单。
 */
import fs from 'node:fs';
import { categoriesFile } from './paths.mjs';

/** 分类条目形如 `- { id: 01-array-hash, name: 数组与哈希表 }` */
const CATEGORY_RE = /^-\s*\{\s*id\s*:\s*([^,}]+?)\s*,\s*name\s*:\s*([^}]+?)\s*\}$/;
const TAG_RE = /^-\s*(.+?)\s*$/;

/**
 * @returns {{ categories: {id:string,name:string}[], tags: string[], errors: string[] }}
 */
export function parseCategories(text) {
  const errors = [];
  const categories = [];
  const tags = [];
  let section = null;

  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;

    if (/^categories\s*:\s*$/.test(line)) {
      section = 'categories';
      continue;
    }
    if (/^tags\s*:\s*$/.test(line)) {
      section = 'tags';
      continue;
    }

    if (section === 'categories') {
      const m = CATEGORY_RE.exec(line);
      if (!m) {
        errors.push(
          `categories.yml 第 ${i + 1} 行：分类格式应为 \`- { id: xx-yy, name: 中文名 }\` —— ${line}`,
        );
        continue;
      }
      categories.push({ id: m[1], name: m[2] });
      continue;
    }

    if (section === 'tags') {
      const m = TAG_RE.exec(line);
      if (!m) {
        errors.push(`categories.yml 第 ${i + 1} 行：标签格式应为 \`- 标签名\` —— ${line}`);
        continue;
      }
      tags.push(m[1]);
      continue;
    }

    errors.push(`categories.yml 第 ${i + 1} 行：出现在 categories:/tags: 段落之外 —— ${line}`);
  }

  const dupCat = firstDuplicate(categories.map((c) => c.id));
  if (dupCat) errors.push(`categories.yml：分类 id 重复 —— ${dupCat}`);

  const dupTag = firstDuplicate(tags);
  if (dupTag) errors.push(`categories.yml：标签重复 —— ${dupTag}`);

  return { categories, tags, errors };
}

function firstDuplicate(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return x;
    seen.add(x);
  }
  return null;
}

/** 从仓库根读取并解析 categories.yml。文件缺失时返回错误而非抛异常。 */
export function loadCategories(root) {
  const file = categoriesFile(root);
  if (!fs.existsSync(file)) {
    return { categories: [], tags: [], errors: [`找不到 categories.yml：${file}`] };
  }
  return parseCategories(fs.readFileSync(file, 'utf8'));
}

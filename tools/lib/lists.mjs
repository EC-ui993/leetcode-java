/**
 * 解析 lists/*.yml —— 题单清单（Hot 100 等）。
 *
 * 设计取舍：题单归属**由题号推导**，不在题目的 front-matter 里手动标注标签。
 * 原因是手动标注会漏、会写错（本项目真的犯过一次：把不在 Hot 100 里的题
 * 标成了 Hot100）。清单是唯一真相源，写错了脚本立刻能查出来。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 题目条目形如 `- { num: 1, title: 两数之和, difficulty: Easy }` */
const PROBLEM_RE =
  /^-\s*\{\s*num\s*:\s*(\d+)\s*,\s*title\s*:\s*(.+?)\s*,\s*difficulty\s*:\s*(Easy|Medium|Hard)\s*\}$/;

export function listsDir(root) {
  return path.join(root, 'lists');
}

/**
 * @returns {{ meta: Record<string,string>, problems: {num:number,title:string,difficulty:string}[], errors: string[] }}
 */
export function parseList(text, label = 'list') {
  const errors = [];
  const meta = {};
  const problems = [];
  let inProblems = false;

  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;
    const where = `${label} 第 ${i + 1} 行`;

    if (/^problems\s*:\s*$/.test(line)) {
      inProblems = true;
      continue;
    }

    if (!inProblems) {
      const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.+)$/.exec(line);
      if (!m) {
        errors.push(`${where}：无法解析 —— ${line}`);
        continue;
      }
      meta[m[1]] = m[2].trim();
      continue;
    }

    const m = PROBLEM_RE.exec(line);
    if (!m) {
      errors.push(
        `${where}：题目格式应为 \`- { num: 1, title: 题名, difficulty: Easy }\` —— ${line}`,
      );
      continue;
    }
    problems.push({ num: Number(m[1]), title: m[2], difficulty: m[3] });
  }

  if (!meta.id) errors.push(`${label}：缺少 id`);
  if (!meta.name) errors.push(`${label}：缺少 name`);

  const dup = firstDuplicate(problems.map((p) => p.num));
  if (dup !== null) errors.push(`${label}：题号重复 —— ${dup}`);

  if (problems.length === 0) errors.push(`${label}：problems: 下没有任何题目`);

  return { meta, problems, errors };
}

function firstDuplicate(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return x;
    seen.add(x);
  }
  return null;
}

/**
 * 读取 lists/ 下所有 .yml。
 * @returns {{ lists: {id:string,name:string,url:string,problems:object[],file:string}[], errors: string[] }}
 */
export function loadLists(root) {
  const dir = listsDir(root);
  if (!fs.existsSync(dir)) return { lists: [], errors: [] };

  const errors = [];
  const lists = [];

  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.yml')) continue;
    const full = path.join(dir, file);
    const { meta, problems, errors: parseErrors } = parseList(
      fs.readFileSync(full, 'utf8'),
      `lists/${file}`,
    );
    parseErrors.forEach((e) => errors.push(e));
    if (parseErrors.length > 0) continue;
    lists.push({
      id: meta.id,
      name: meta.name,
      url: meta.url ?? '',
      problems,
      file: `lists/${file}`,
    });
  }

  const dupId = firstDuplicate(lists.map((l) => l.id));
  if (dupId !== null) errors.push(`lists/：题单 id 重复 —— ${dupId}`);

  return { lists, errors };
}

/**
 * 统计某个题单的完成情况。
 * @param {{problems: object[]}} list
 * @param {{num:number}[]} doneProblems 仓库里已归档的题目
 */
export function listProgress(list, doneProblems) {
  const doneNums = new Set(doneProblems.map((p) => p.num));
  const done = list.problems.filter((p) => doneNums.has(p.num));
  const remaining = list.problems.filter((p) => !doneNums.has(p.num));
  return {
    total: list.problems.length,
    done,
    remaining,
    percent: list.problems.length === 0 ? 0 : Math.round((done.length / list.problems.length) * 100),
  };
}

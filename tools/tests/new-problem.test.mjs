import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runNewProblem } from '../new-problem.mjs';
import { repoRoot, categoriesFile, templateFile } from '../lib/paths.mjs';
import { parseFrontmatter } from '../lib/frontmatter.mjs';
import { localDate } from '../lib/util.mjs';

/** 建一个只含 categories.yml 与 docs/TEMPLATE.md 的最小仓库 fixture。 */
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-fx-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.copyFileSync(categoriesFile(repoRoot()), categoriesFile(root));
  fs.copyFileSync(templateFile(repoRoot()), templateFile(root));
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

const BASE = [
  '--id', '1',
  '--title', '两数之和',
  '--slug', 'two-sum',
  '--cat', '01-array-hash',
  '--tags', '数组,哈希表',
  '--difficulty', 'Easy',
];

test('合法参数创建成功，front-matter 各字段正确', () => {
  const root = makeFixture();
  try {
    const r = runNewProblem([...BASE, '--root', root]);
    assert.equal(r.code, 0, r.stderr);

    const readme = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum', 'README.md');
    const java = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum', 'Solution.java');
    assert.ok(fs.existsSync(readme), 'README.md 应存在');
    assert.ok(fs.existsSync(java), 'Solution.java 应存在');

    const { data, body, errors } = parseFrontmatter(fs.readFileSync(readme, 'utf8'));
    assert.deepEqual(errors, []);
    assert.equal(data.id, 'lc-0001');
    assert.equal(data.title, '两数之和');
    assert.equal(data.category, '01-array-hash');
    assert.deepEqual(data.tags, ['数组', '哈希表']);
    assert.equal(data.difficulty, 'Easy');
    assert.equal(
      data.status,
      '未开始',
      '脚手架绝不替用户宣称已完成：默认必须是「未开始」',
    );
    assert.equal(data.date, localDate(), 'date 默认应为本地时区的今天');
    assert.equal(data.url, 'https://leetcode.cn/problems/two-sum/');

    // 模板中的占位符应被替换
    assert.ok(body.includes('# lc-0001 两数之和'));
    assert.ok(!body.includes('{{id}}'));
    assert.ok(!body.includes('{{title}}'));
    assert.ok(body.includes('## 思路'));

    // 模板里的 HTML 注释是「模板文档」，不应被带进笔记
    assert.ok(!body.includes('<!--'), '生成的笔记不应残留 HTML 注释');
    assert.ok(!body.includes('唯一模板来源'), '模板的规范说明不应出现在笔记里');

    // 正文里的填写提示是普通文本，应当保留
    assert.ok(body.includes('用自己的话写'), '填写提示应保留');
  } finally {
    cleanup(root);
  }
});

test('题号重复时报错，且不破坏已有内容', () => {
  const root = makeFixture();
  try {
    assert.equal(runNewProblem([...BASE, '--root', root]).code, 0);

    const readme = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum', 'README.md');
    fs.writeFileSync(readme, '已被人工修改的内容', 'utf8');

    // 同题号重复提交（题号查重应先于目录查重触发）
    const r = runNewProblem([...BASE, '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('已存在'), r.stderr);
    assert.equal(fs.readFileSync(readme, 'utf8'), '已被人工修改的内容');
  } finally {
    cleanup(root);
  }
});

test('非法标签时报错并指明标签', () => {
  const root = makeFixture();
  try {
    const args = BASE.map((v) => (v === '数组,哈希表' ? '数组,不存在的标签' : v));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('不存在的标签'), r.stderr);
    assert.ok(r.stderr.includes('categories.yml'), '应提示去编辑 categories.yml');
  } finally {
    cleanup(root);
  }
});

test('非法分类时报错并列出合法分类', () => {
  const root = makeFixture();
  try {
    const args = BASE.map((v) => (v === '01-array-hash' ? '99-nope' : v));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('99-nope'), r.stderr);
    assert.ok(r.stderr.includes('01-array-hash'), '应列出合法分类');
  } finally {
    cleanup(root);
  }
});

test('目标目录已存在时拒绝写入，内容不被改动', () => {
  const root = makeFixture();
  try {
    const dir = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'README.md'), '人工内容', 'utf8');

    const r = runNewProblem([...BASE, '--root', root]);

    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('已存在'), r.stderr);
    assert.equal(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), '人工内容');
    assert.ok(!fs.existsSync(path.join(dir, 'Solution.java')), '不应写入任何新文件');
  } finally {
    cleanup(root);
  }
});

test('目标路径被同名文件占用时，「拒绝覆盖」守卫生效', () => {
  // 这个用例专门覆盖 fs.existsSync 守卫：同名**文件**不会被 listProblemDirs 枚举到
  // （它只收目录），因此题号查重不会命中，只有路径占用守卫能拦住。
  const root = makeFixture();
  try {
    const dir = path.join(root, 'problems', '01-array-hash');
    fs.mkdirSync(dir, { recursive: true });
    const blocked = path.join(dir, 'lc-0001-two-sum');
    fs.writeFileSync(blocked, '占位文件', 'utf8');

    const r = runNewProblem([...BASE, '--root', root]);

    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('拒绝覆盖'), r.stderr);
    assert.equal(fs.readFileSync(blocked, 'utf8'), '占位文件');
  } finally {
    cleanup(root);
  }
});

test('缺少 --slug 时退出码为 2（用法错误）', () => {
  const root = makeFixture();
  try {
    const args = BASE.filter((v, i) => !(BASE[i - 1] === '--slug' || v === '--slug'));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 2);
    assert.ok(r.stderr.includes('--slug'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('非法 difficulty 退出码为 1', () => {
  const root = makeFixture();
  try {
    const args = BASE.map((v) => (v === 'Easy' ? '简单' : v));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('Easy / Medium / Hard'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('非法 status 退出码为 1', () => {
  const root = makeFixture();
  try {
    const r = runNewProblem([...BASE, '--status', '做完了', '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('未开始'), r.stderr);
    assert.ok(r.stderr.includes('独立完成'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('--status 显式给出时覆盖默认的「未开始」', () => {
  const root = makeFixture();
  try {
    const r = runNewProblem([...BASE, '--status', '看题解完成', '--root', root]);
    assert.equal(r.code, 0, r.stderr);
    const readme = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum', 'README.md');
    const { data } = parseFrontmatter(fs.readFileSync(readme, 'utf8'));
    assert.equal(data.status, '看题解完成');
  } finally {
    cleanup(root);
  }
});

test('绝对路径超过 240 字符时报错', () => {
  const root = makeFixture();
  try {
    const head = path.join(root, 'problems', '01-array-hash', 'lc-0001-');
    const need = 240 - head.length - '\\README.md'.length + 1;
    const slug = 'a'.repeat(Math.max(1, need));

    const args = BASE.map((v) => (v === 'two-sum' ? slug : v));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('超长'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('--dry-run 不写入任何文件', () => {
  const root = makeFixture();
  try {
    const r = runNewProblem([...BASE, '--dry-run', '--root', root]);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes('dry-run'));
    assert.ok(!fs.existsSync(path.join(root, 'problems')));
  } finally {
    cleanup(root);
  }
});

test('--slug 被规范化（大写与空格）', () => {
  const root = makeFixture();
  try {
    const args = BASE.map((v) => (v === 'two-sum' ? ' Two Sum ' : v));
    const r = runNewProblem([...args, '--root', root]);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum')));
  } finally {
    cleanup(root);
  }
});

test('--url 显式给出时覆盖默认推导', () => {
  const root = makeFixture();
  try {
    const r = runNewProblem([...BASE, '--url', 'https://example.com/x', '--root', root]);
    assert.equal(r.code, 0, r.stderr);
    const readme = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum', 'README.md');
    const { data } = parseFrontmatter(fs.readFileSync(readme, 'utf8'));
    assert.equal(data.url, 'https://example.com/x');
  } finally {
    cleanup(root);
  }
});

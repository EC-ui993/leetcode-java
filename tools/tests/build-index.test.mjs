import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runBuildIndex } from '../build-index.mjs';
import { repoRoot, categoriesFile } from '../lib/paths.mjs';
import { stringifyFrontmatter } from '../lib/frontmatter.mjs';
import { padNum } from '../lib/util.mjs';

const START = '<!-- AUTO-GENERATED:START -->';
const END = '<!-- AUTO-GENERATED:END -->';

const HAND_WRITTEN = '# 手写标题\n\n这是手写区，绝不能被脚本改动。\n';

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-bi-'));
  fs.copyFileSync(categoriesFile(repoRoot()), categoriesFile(root));
  fs.writeFileSync(
    path.join(root, 'README.md'),
    `${HAND_WRITTEN}\n${START}\n${END}\n\n## 手写尾部\n`,
    'utf8',
  );
  fs.writeFileSync(path.join(root, 'INDEX-BY-TAG.md'), `${START}\n${END}\n`, 'utf8');
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

let seq = 0;

function addProblem(root, overrides = {}) {
  const num = overrides.num ?? 1;
  const slug = overrides.slug ?? `slug-${++seq}`;
  const category = overrides.category ?? '01-array-hash';
  const data = {
    id: overrides.id ?? `lc-${padNum(num)}`,
    title: overrides.title ?? '两数之和',
    category: overrides.categoryField ?? category,
    tags: overrides.tags ?? ['数组', '哈希表'],
    difficulty: overrides.difficulty ?? 'Easy',
    status: overrides.status ?? '独立完成',
    url: `https://leetcode.cn/problems/${slug}/`,
    date: overrides.date ?? '2026-09-15',
  };
  const dir = path.join(root, 'problems', category, `lc-${padNum(num)}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'README.md'),
    `${stringifyFrontmatter(data)}\n\n# ${data.id} ${data.title}\n`,
    'utf8',
  );
  return dir;
}

test('空仓库时列出全部 18 个分类且计数为 0', () => {
  const root = makeFixture();
  try {
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 0, r.stderr);

    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.ok(readme.includes('01-array-hash'));
    assert.ok(readme.includes('18-design'));
    assert.ok(readme.includes('还没有题目'));

    // 手写区必须逐字保留
    assert.ok(readme.startsWith(HAND_WRITTEN));
    assert.ok(readme.includes('## 手写尾部'));
  } finally {
    cleanup(root);
  }
});

test('正常题目：标记区含该题，且题名渲染为相对链接', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', title: '两数之和' });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 0, r.stderr);

    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.ok(
      readme.includes('[两数之和](problems/01-array-hash/lc-0001-two-sum/README.md)'),
      '题名必须是可点击的相对链接',
    );
    assert.ok(readme.includes('**共 1 题**'));
    assert.ok(readme.includes('数组与哈希表（1）'));
    // 手写区仍在
    assert.ok(readme.startsWith(HAND_WRITTEN));
  } finally {
    cleanup(root);
  }
});

test('category 与实际目录不一致时报错，并同时指出两边取值', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', category: '01-array-hash', categoryField: '02-two-pointers' });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('01-array-hash'), r.stderr);
    assert.ok(r.stderr.includes('02-two-pointers'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('缺少必填字段时报错', () => {
  const root = makeFixture();
  try {
    const dir = path.join(root, 'problems', '01-array-hash', 'lc-0001-two-sum');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'README.md'),
      '---\nid: lc-0001\ntitle: 两数之和\n---\n\n# x\n',
      'utf8',
    );
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('缺少必填字段'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('id 重复时报错', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', category: '01-array-hash' });
    addProblem(root, { num: 1, slug: 'two-sum', category: '02-two-pointers', tags: ['双指针'] });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('重复'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('标签不在词表内时报错', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', tags: ['数组', '瞎写的标签'] });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('瞎写的标签'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('非法 status（使用已废弃的「未开始」）时报错', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', status: '未开始' });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('未开始'), r.stderr);
  } finally {
    cleanup(root);
  }
});

test('多标签题在索引中于多个标签下各出现一次', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', tags: ['数组', '哈希表'] });
    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 0, r.stderr);

    const tagIndex = fs.readFileSync(path.join(root, 'INDEX-BY-TAG.md'), 'utf8');
    const hits = tagIndex.split('### 数组')[1] ?? '';
    assert.ok(tagIndex.includes('### 数组（1）'), '数组标签下应出现 1 次');
    assert.ok(tagIndex.includes('### 哈希表（1）'), '哈希表标签下应出现 1 次');
    assert.ok(hits.includes('两数之和'));
  } finally {
    cleanup(root);
  }
});

test('幂等：连续两次运行，第二次不写盘', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum' });

    const first = runBuildIndex(['--root', root]);
    assert.equal(first.code, 0, first.stderr);
    assert.ok(first.stdout.includes('README.md 已更新'));

    const before = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    const mtimeBefore = fs.statSync(path.join(root, 'README.md')).mtimeMs;

    const second = runBuildIndex(['--root', root]);
    assert.equal(second.code, 0, second.stderr);
    assert.ok(second.stdout.includes('README.md 未变更'), second.stdout);
    assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), before);
    assert.equal(fs.statSync(path.join(root, 'README.md')).mtimeMs, mtimeBefore);
  } finally {
    cleanup(root);
  }
});

test('索引无生成时间戳，保证跨天运行结果稳定', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum' });
    runBuildIndex(['--root', root]);
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.ok(!/生成时间|Generated at|最后更新/.test(readme), '不应包含随时间变化的字段');
  } finally {
    cleanup(root);
  }
});

test('标记缺失时报错，且文件内容完全不变', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum' });
    const readmePath = path.join(root, 'README.md');
    const noMarkers = '# 手写标题\n\n没有标记的文件。\n';
    fs.writeFileSync(readmePath, noMarkers, 'utf8');

    const r = runBuildIndex(['--root', root]);

    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('标记'), r.stderr);
    assert.equal(fs.readFileSync(readmePath, 'utf8'), noMarkers, '绝不能整文件覆盖');
  } finally {
    cleanup(root);
  }
});

test('--check 只校验不写盘', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum' });
    const before = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

    const r = runBuildIndex(['--check', '--root', root]);

    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('校验通过'));
    assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), before);
  } finally {
    cleanup(root);
  }
});

test('--check 在元数据有问题时退出码为 1', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum', category: '01-array-hash', categoryField: '02-two-pointers' });
    const r = runBuildIndex(['--check', '--root', root]);
    assert.equal(r.code, 1);
  } finally {
    cleanup(root);
  }
});

test('--dry-run 打印结果但不写盘', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 1, slug: 'two-sum' });
    const before = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

    const r = runBuildIndex(['--dry-run', '--root', root]);

    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('未写入任何文件'));
    assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), before);
  } finally {
    cleanup(root);
  }
});

test('分类按 id 升序、同分类内题目按题号升序', () => {
  const root = makeFixture();
  try {
    addProblem(root, { num: 300, slug: 'lis', title: '最长递增子序列', category: '10-dynamic-programming', tags: ['LIS'] });
    addProblem(root, { num: 10, slug: 'regex', title: '正则匹配', category: '10-dynamic-programming', tags: ['线性DP'] });

    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 0, r.stderr);

    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.ok(readme.indexOf('0010') < readme.indexOf('0300'), '题号应升序');
    assert.ok(
      readme.indexOf('01-array-hash') < readme.indexOf('10-dynamic-programming'),
      '分类应按 id 升序',
    );
  } finally {
    cleanup(root);
  }
});

test('题目目录名不合规时报错', () => {
  const root = makeFixture();
  try {
    const dir = path.join(root, 'problems', '01-array-hash', 'two-sum');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'README.md'), '---\nid: lc-0001\n---\n', 'utf8');

    const r = runBuildIndex(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('lc-<题号>-<英文slug>'), r.stderr);
  } finally {
    cleanup(root);
  }
});

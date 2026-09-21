import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCategories, loadCategories } from '../lib/categories.mjs';
import { localDate, slugify, padNum } from '../lib/util.mjs';
import { parseProblemDirName, problemDirName, repoRoot } from '../lib/paths.mjs';

test('localDate 使用本地时间，不走 UTC', () => {
  // 回归测试：UTC+8 的 2026-01-02 03:00 若误用 toISOString() 会得到 2026-01-01
  assert.equal(localDate(new Date(2026, 0, 2, 3, 0, 0)), '2026-01-02');
});

test('localDate 对月/日补零', () => {
  assert.equal(localDate(new Date(2026, 8, 5)), '2026-09-05');
});

test('slugify 转小写并把空白转连字符，不截断', () => {
  assert.equal(slugify('  Two  Sum '), 'two-sum');
  assert.equal(
    slugify('Minimum Number Of Operations To Make Array Continuous'),
    'minimum-number-of-operations-to-make-array-continuous',
  );
});

test('padNum 左补零到四位，超过四位原样保留', () => {
  assert.equal(padNum(1), '0001');
  assert.equal(padNum(300), '0300');
  assert.equal(padNum(12345), '12345');
});

test('parseProblemDirName 解析目录名', () => {
  assert.deepEqual(parseProblemDirName('lc-0001-two-sum'), { num: 1, slug: 'two-sum' });
  assert.equal(parseProblemDirName('two-sum'), null);
  assert.equal(parseProblemDirName('lc-0001-Two_Sum'), null);
  assert.equal(parseProblemDirName('lc-0001-'), null);
});

test('problemDirName 与 parseProblemDirName 往返一致', () => {
  const name = problemDirName(300, 'longest-increasing-subsequence');
  assert.equal(name, 'lc-0300-longest-increasing-subsequence');
  assert.deepEqual(parseProblemDirName(name), {
    num: 300,
    slug: 'longest-increasing-subsequence',
  });
});

test('parseCategories 解析分类与标签，忽略注释', () => {
  const { categories, tags, errors } = parseCategories(
    [
      '# 顶部注释',
      'categories:',
      '  - { id: 01-array-hash, name: 数组与哈希表 }',
      'tags:',
      '  - 数组',
      '  # 段内注释',
      '  - 哈希表',
    ].join('\n'),
  );

  assert.deepEqual(errors, []);
  assert.deepEqual(categories, [{ id: '01-array-hash', name: '数组与哈希表' }]);
  assert.deepEqual(tags, ['数组', '哈希表']);
});

test('parseCategories 检出重复标签', () => {
  const { errors } = parseCategories('tags:\n  - 数组\n  - 数组\n');
  assert.ok(errors.some((e) => e.includes('标签重复')));
});

test('parseCategories 检出重复分类 id', () => {
  const { errors } = parseCategories(
    'categories:\n  - { id: 01-a, name: A }\n  - { id: 01-a, name: B }\n',
  );
  assert.ok(errors.some((e) => e.includes('分类 id 重复')));
});

test('parseCategories 报错时给出所在行号', () => {
  const { errors } = parseCategories('categories:\n  - 格式错误的一行\n');
  assert.ok(errors.some((e) => e.includes('第 2 行')));
});

test('parseCategories 检出段落之外的条目', () => {
  const { errors } = parseCategories('- 悬空条目\ncategories:\n');
  assert.ok(errors.some((e) => e.includes('段落之外')));
});

test('真实 categories.yml：18 个分类、58 个标签、均无重复', () => {
  // 这两个数字是硬编码的，改 categories.yml 时必须同步更新。
  // 硬编码是有意的：它能抓出「不小心删掉某个分类/标签」这类静默破坏。
  const { categories, tags, errors } = loadCategories(repoRoot());

  assert.deepEqual(errors, []);
  assert.equal(categories.length, 18);
  assert.equal(tags.length, 58);
  assert.equal(new Set(categories.map((c) => c.id)).size, 18);
  assert.equal(new Set(tags).size, 58);
});

test('loadCategories 对不存在的仓库根返回错误而非抛异常', () => {
  const { errors } = loadCategories('D:/__definitely_not_a_repo__');
  assert.ok(errors.length > 0);
});

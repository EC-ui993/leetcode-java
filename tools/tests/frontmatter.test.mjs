import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, stringifyFrontmatter } from '../lib/frontmatter.mjs';

test('解析扁平字段与单行数组', () => {
  const text = [
    '---',
    'id: lc-0001',
    'title: 两数之和',
    'tags: [数组, 哈希表]',
    '---',
    '',
    '# 正文',
  ].join('\n');

  const { data, body, errors } = parseFrontmatter(text);

  assert.deepEqual(errors, []);
  assert.equal(data.id, 'lc-0001');
  assert.equal(data.title, '两数之和');
  assert.deepEqual(data.tags, ['数组', '哈希表']);
  assert.equal(body, '\n# 正文');
});

test('值中的冒号只在第一个冒号处分割', () => {
  const { data, errors } = parseFrontmatter(
    '---\nurl: https://leetcode.cn/problems/two-sum/\n---\n',
  );
  assert.deepEqual(errors, []);
  assert.equal(data.url, 'https://leetcode.cn/problems/two-sum/');
});

test('缺少 front-matter 时报错', () => {
  const { data, errors } = parseFrontmatter('# 没有 front-matter\n');
  assert.deepEqual(data, {});
  assert.ok(errors.length > 0);
});

test('front-matter 未闭合时报错', () => {
  const { errors } = parseFrontmatter('---\nid: lc-0001\n');
  assert.ok(errors.some((e) => e.includes('未闭合')));
});

test('嵌套结构被拒绝', () => {
  const { errors } = parseFrontmatter('---\nmeta:\n  id: lc-0001\n---\n');
  assert.ok(errors.length > 0);
});

test('块标量被拒绝', () => {
  const { errors } = parseFrontmatter('---\ntitle: |\n---\n');
  assert.ok(errors.some((e) => e.includes('块标量')));
});

test('空数组解析为空数组', () => {
  const { data, errors } = parseFrontmatter('---\ntags: []\n---\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(data.tags, []);
});

test('body 不包含 front-matter', () => {
  const { body } = parseFrontmatter('---\nid: lc-0001\n---\n# 标题\n\n正文\n');
  assert.ok(!body.includes('lc-0001'));
  assert.ok(body.includes('# 标题'));
});

test('front-matter 内的注释行被忽略', () => {
  const { data, errors } = parseFrontmatter('---\n# 这是注释\nid: lc-0001\n---\n');
  assert.deepEqual(errors, []);
  assert.equal(data.id, 'lc-0001');
});

test('序列化后能被自身解析回来（往返一致）', () => {
  const data = {
    id: 'lc-0001',
    title: '两数之和',
    category: '01-array-hash',
    tags: ['数组', '哈希表'],
    difficulty: 'Easy',
    status: '独立完成',
    url: 'https://leetcode.cn/problems/two-sum/',
    date: '2026-09-15',
  };

  const { data: back, errors } = parseFrontmatter(`${stringifyFrontmatter(data)}\n`);

  assert.deepEqual(errors, []);
  assert.deepEqual(back, data);
});

test('真实 docs/TEMPLATE.md 可被解析且无错误', async () => {
  const fs = await import('node:fs');
  const { repoRoot, templateFile } = await import('../lib/paths.mjs');

  const { errors } = parseFrontmatter(fs.readFileSync(templateFile(repoRoot()), 'utf8'));

  assert.deepEqual(errors, []);
});

test('重复字段被检出，而不是静默覆盖', () => {
  // 手写 front-matter 时最容易犯的错：另起一行写同名字段。
  // 若不检出，前面的值会被静默丢弃 —— 属于「沉默失败」，比报错危险得多。
  const { data, errors } = parseFrontmatter(
    '---\ntags: [双指针, 数组]\ntags: [Hot100]\n---\n',
  );

  assert.ok(errors.length > 0, '重复字段必须报错');
  assert.ok(
    errors.some((e) => e.includes('重复')),
    `错误信息应点明「重复」，实际为：${errors.join(' | ')}`,
  );
  // 报错即可，不关心保留哪个值；但必须让用户知道前一个被丢了
  assert.ok(Array.isArray(data.tags));
});

test('重复字段的错误信息带行号且指出被丢弃的后果', () => {
  const { errors } = parseFrontmatter('---\nid: lc-0001\nid: lc-9999\n---\n');
  assert.ok(errors.some((e) => e.includes('第 3 行')), errors.join(' | '));
});

test('不同字段不算重复', () => {
  const { errors } = parseFrontmatter('---\nid: lc-0001\ntitle: 两数之和\n---\n');
  assert.deepEqual(errors, []);
});

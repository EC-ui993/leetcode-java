import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseList, loadLists, listProgress, listsDir } from '../lib/lists.mjs';
import { repoRoot } from '../lib/paths.mjs';

test('parseList 解析元信息与题目', () => {
  const { meta, problems, errors } = parseList(
    [
      '# 注释',
      'id: hot100',
      'name: 力扣热题 HOT 100',
      'url: https://leetcode.cn/studyplan/top-100-liked/',
      '',
      'problems:',
      '  - { num: 1,   title: 两数之和,       difficulty: Easy }',
      '  # 段内注释',
      '  - { num: 49,  title: 字母异位词分组, difficulty: Medium }',
    ].join('\n'),
  );

  assert.deepEqual(errors, []);
  assert.equal(meta.id, 'hot100');
  assert.equal(meta.name, '力扣热题 HOT 100');
  assert.deepEqual(problems, [
    { num: 1, title: '两数之和', difficulty: 'Easy' },
    { num: 49, title: '字母异位词分组', difficulty: 'Medium' },
  ]);
});

test('parseList 检出题号重复', () => {
  const { errors } = parseList('id: a\nname: b\nproblems:\n  - { num: 1, title: 甲, difficulty: Easy }\n  - { num: 1, title: 乙, difficulty: Easy }\n');
  assert.ok(errors.some((e) => e.includes('题号重复')), errors.join(' | '));
});

test('parseList 对格式错误给出行号', () => {
  const { errors } = parseList('id: a\nname: b\nproblems:\n  - 格式不对\n');
  assert.ok(errors.some((e) => e.includes('第 4 行')), errors.join(' | '));
});

test('parseList 检出缺少 id / name', () => {
  const { errors } = parseList('problems:\n  - { num: 1, title: 甲, difficulty: Easy }\n');
  assert.ok(errors.some((e) => e.includes('缺少 id')));
  assert.ok(errors.some((e) => e.includes('缺少 name')));
});

test('parseList 拒绝非法 difficulty', () => {
  const { errors } = parseList('id: a\nname: b\nproblems:\n  - { num: 1, title: 甲, difficulty: 简单 }\n');
  assert.ok(errors.length > 0);
});

test('真实 lists/hot100.yml：正好 100 道、题号唯一、难度合法', () => {
  const { lists, errors } = loadLists(repoRoot());

  assert.deepEqual(errors, []);
  assert.equal(lists.length, 1);

  const hot = lists[0];
  assert.equal(hot.id, 'hot100');
  assert.equal(hot.name, '力扣热题 HOT 100');

  // 官方题单就是 100 道。数字对不上说明转录时漏抄或多抄了。
  assert.equal(hot.problems.length, 100, `期望 100 道，实际 ${hot.problems.length} 道`);
  assert.equal(new Set(hot.problems.map((p) => p.num)).size, 100, '题号必须唯一');

  for (const p of hot.problems) {
    assert.ok(p.title.length > 0, `题号 ${p.num} 缺题名`);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(p.difficulty));
  }
});

test('真实 lists/hot100.yml 的首尾题号符合官方题单', () => {
  const { lists } = loadLists(repoRoot());
  const nums = lists[0].problems.map((p) => p.num);
  assert.equal(nums[0], 1, '首题应为 lc-0001 两数之和');
  assert.equal(nums[nums.length - 1], 287, '末题应为 lc-0287 寻找重复数');
});

test('listProgress 统计已完成与未完成', () => {
  const list = {
    problems: [
      { num: 1, title: '甲', difficulty: 'Easy' },
      { num: 49, title: '乙', difficulty: 'Medium' },
      { num: 128, title: '丙', difficulty: 'Medium' },
      { num: 283, title: '丁', difficulty: 'Easy' },
    ],
  };
  const progress = listProgress(list, [{ num: 1 }, { num: 128 }]);

  assert.equal(progress.total, 4);
  assert.deepEqual(progress.done.map((p) => p.num), [1, 128]);
  assert.deepEqual(progress.remaining.map((p) => p.num), [49, 283]);
  assert.equal(progress.percent, 50);
});

test('listProgress 对空题单不除零', () => {
  const p = listProgress({ problems: [] }, []);
  assert.equal(p.total, 0);
  assert.equal(p.percent, 0);
});

test('listsDir 指向仓库下的 lists 目录', () => {
  assert.ok(listsDir(repoRoot()).endsWith('lists'));
});

test('loadLists 在没有 lists 目录时返回空而不是抛异常', () => {
  const { lists, errors } = loadLists('D:/__definitely_not_a_repo__');
  assert.deepEqual(lists, []);
  assert.deepEqual(errors, []);
});

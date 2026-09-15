import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runCheckCompile } from '../check-compile.mjs';

const javacAvailable =
  spawnSync('javac', ['-version'], { stdio: 'ignore' }).status === 0;

const needsJavac = javacAvailable ? {} : { skip: '环境里没有 javac，跳过真实编译用例' };

function makeRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lc-cc-'));
}

function writeProblem(root, rel, files) {
  const dir = path.join(root, 'problems', rel);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content, 'utf8');
  }
  return dir;
}

test('problems/ 为空时退出码为 0', () => {
  const root = makeRoot();
  try {
    const r = runCheckCompile(['--root', root]);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('没有题目可检查'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('题目录下没有 .java 文件时报错', () => {
  const root = makeRoot();
  try {
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {});
    const r = runCheckCompile(['--root', root]);
    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('没有任何 .java 文件'), r.stderr);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('带 UTF-8 BOM 的 .java 被拦下，并给出可操作提示', () => {
  const root = makeRoot();
  try {
    // Windows 编辑器与 PowerShell 的 -Encoding UTF8 都会写 BOM，javac 会直接报
    // illegal character: '\ufeff'。应提前拦下而不是把这条莫名其妙的错误丢给用户。
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {
      'Solution.java': '\ufeffclass Solution {}\n',
    });

    const r = runCheckCompile(['--root', root]);

    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('BOM'), r.stderr);
    assert.ok(r.stderr.includes('Solution.java'), r.stderr);
    assert.ok(r.stderr.includes('无 BOM'), '应告诉用户怎么改');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('无 BOM 的可编译解法通过检查', needsJavac, () => {
  const root = makeRoot();
  try {
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {
      'Solution.java': 'class Solution {\n    int answer() { return 42; }\n}\n',
    });

    const r = runCheckCompile(['--root', root]);

    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('编译检查通过'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('编译失败的解法退出码为 1', needsJavac, () => {
  const root = makeRoot();
  try {
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {
      'Solution.java': 'class Solution {\n    int broken() { return "not an int"; }\n}\n',
    });

    const r = runCheckCompile(['--root', root]);

    assert.equal(r.code, 1);
    assert.ok(r.stderr.includes('编译失败'), r.stderr);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('同一目录下的主解法与备选解各自独立，不因同名类冲突', needsJavac, () => {
  // 这条用例守住 §5.4 铁律 2：逐目录编译。几十个题目录里都有 class Solution，
  // 默认包下合并编译必然冲突，所以必须一个题目录一次 javac。
  const root = makeRoot();
  try {
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {
      'Solution.java': 'class Solution {\n    int answer() { return 1; }\n}\n',
      'SolutionAlt.java': 'class SolutionAlt {\n    int answer() { return 2; }\n}\n',
    });
    writeProblem(root, '02-two-pointers/lc-0167-two-sum-ii', {
      'Solution.java': 'class Solution {\n    int answer() { return 3; }\n}\n',
    });

    const r = runCheckCompile(['--root', root]);

    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('2 个题目录'));
    assert.ok(r.stdout.includes('3 个 .java 文件'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('同一目录内两个文件都叫 class Solution 时会失败（说明为何不能合并编译）', needsJavac, () => {
  const root = makeRoot();
  try {
    writeProblem(root, '01-array-hash/lc-0001-two-sum', {
      'Solution.java': 'class Solution {\n    int a() { return 1; }\n}\n',
      'SolutionAlt.java': 'class Solution {\n    int b() { return 2; }\n}\n',
    });

    const r = runCheckCompile(['--root', root]);

    assert.equal(r.code, 1, '重复类名应当被 javac 拒绝');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('不支持位置参数，退出码为 2', () => {
  const root = makeRoot();
  try {
    const r = runCheckCompile(['多余参数', '--root', root]);
    assert.equal(r.code, 2);
    assert.ok(r.stderr.includes('位置参数'), r.stderr);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

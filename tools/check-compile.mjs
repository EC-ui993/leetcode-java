#!/usr/bin/env node
/**
 * 编译检查：对每个题目录**单独**执行一次 javac。
 *
 * 为什么要逐目录执行：几十个题目录里都有 `class Solution`（默认包，不能加 package，
 * 否则 LeetCode 提交会报错），合并编译必然冲突。
 *
 * 关于 stdio：刻意使用 `stdio: ['ignore','inherit','inherit']` 而**不捕获** javac 输出。
 *   - javac 成功时本就静默，失败时原始错误直接打到终端，比二次包装的摘要更有用
 *   - 同时避开了管道式 stdio 在受限环境下失败的问题
 *
 * 退出码：0 全部通过 / 1 存在编译失败 / 2 用法错误
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { repoRoot, listProblemDirs } from './lib/paths.mjs';

const USAGE = `用法：
  node tools/check-compile.mjs [--root <仓库根>]

对每个题目录单独执行 javac（产物写入系统临时目录，不污染仓库）。
退出码：0 全部通过 / 1 存在编译失败 / 2 用法错误`;

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    if (key === 'help') {
      out.help = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) return { error: `参数 --${key} 缺少值` };
    out[key] = value;
    i++;
  }
  return out;
}

/** 判断文件是否以 UTF-8 BOM（EF BB BF）开头。 */
function hasUtf8Bom(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(3);
    const read = fs.readSync(fd, buf, 0, 3, 0);
    return read === 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * @returns {{ code: number, stdout: string, stderr: string }}
 */
export function runCheckCompile(argv, opts = {}) {
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
  const problems = listProblemDirs(root);

  if (problems.length === 0) {
    out('没有题目可检查（problems/ 为空）。');
    return done(0);
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-javac-'));
  const failures = [];
  let fileCount = 0;
  let javacMissing = false;

  try {
    for (const p of problems) {
      const rel = `${p.category}/${p.dirName}`;
      const files = fs
        .readdirSync(p.dir)
        .filter((f) => f.endsWith('.java'))
        .map((f) => path.join(p.dir, f));

      if (files.length === 0) {
        err(`✗ ${rel}：目录下没有任何 .java 文件`);
        failures.push(rel);
        continue;
      }
      fileCount += files.length;

      // BOM 预检：javac 遇到 UTF-8 BOM 会报 "illegal character: '\ufeff'"，
      // 而 Windows 编辑器与 PowerShell 的 `-Encoding UTF8` 都默认写 BOM。
      // 提前拦下来并给出可操作的提示，好过让用户面对一条不知所云的 javac 错误。
      const bomFiles = files.filter(hasUtf8Bom);
      if (bomFiles.length > 0) {
        for (const f of bomFiles) {
          err(`✗ ${rel}/${path.basename(f)}：文件以 UTF-8 BOM 开头，javac 会直接报 illegal character。`);
        }
        err('  请改用「UTF-8（无 BOM）」保存：VS Code 右下角编码处选 “Save with Encoding → UTF-8”。');
        err('  注意 PowerShell 的 Set-Content -Encoding UTF8 会写入 BOM，改用 [System.IO.File]::WriteAllText。');
        failures.push(rel);
        continue;
      }

      // 每个题目录一个独立的输出目录，避免默认包下的同名 class 相互覆盖
      const outDir = path.join(tmpRoot, rel.replace(/[\\/]/g, '__'));
      fs.mkdirSync(outDir, { recursive: true });

      // -J-Duser.language=en：javac 默认按系统区域输出本地化诊断，在中文 Windows 上
      //   会写成 GBK 字节，而终端按 UTF-8 解读 —— 结果是编译失败时用户只看到乱码。
      //   强制英文区域后全是 ASCII，任何终端都能读，这是编译失败时唯一的诊断来源。
      const res = spawnSync(
        'javac',
        [
          '-J-Duser.language=en',
          '-J-Duser.country=US',
          '-encoding',
          'UTF-8',
          '-d',
          outDir,
          ...files,
        ],
        { stdio: ['ignore', 'inherit', 'inherit'] },
      );

      if (res.error) {
        if (res.error.code === 'ENOENT') {
          err('✗ 未找到 javac。请确认已安装 JDK（不只是 JRE）并在 PATH 中。');
          javacMissing = true;
          break;
        }
        err(`✗ ${rel}：无法启动 javac —— ${res.error.message}`);
        failures.push(rel);
        continue;
      }
      if (res.status !== 0) {
        err(`✗ ${rel}：编译失败（javac 退出码 ${res.status}）`);
        failures.push(rel);
      }
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  if (javacMissing) return done(1);

  if (failures.length > 0) {
    err('');
    err(`✗ 编译检查失败：${failures.length}/${problems.length} 个题目录有问题。`);
    return done(1);
  }

  out(`✓ 编译检查通过：${problems.length} 个题目录，共 ${fileCount} 个 .java 文件。`);
  return done(0);
}

function main() {
  const { code, stdout, stderr } = runCheckCompile(process.argv.slice(2));
  if (stdout) process.stdout.write(`${stdout}\n`);
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.exit(code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

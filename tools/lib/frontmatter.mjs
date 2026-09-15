/**
 * 零依赖 front-matter 解析/序列化。
 *
 * 刻意只支持两种形态（见 docs/TEMPLATE.md 的规范说明）：
 *   key: value
 *   key: [a, b, c]
 *
 * 不支持嵌套与块标量（`|` / `>`）—— 遇到时**记录错误而非静默忽略**，
 * 避免元数据悄悄丢失。这样无需引入 yaml 依赖，仓库里不会出现 node_modules。
 */

const FM = '---';

/**
 * @returns {{ data: Record<string, string|string[]>, body: string, errors: string[] }}
 */
export function parseFrontmatter(text) {
  const src = String(text);
  const lines = src.split(/\r?\n/);

  if (lines[0].trim() !== FM) {
    return {
      data: {},
      body: src,
      errors: ['缺少 front-matter：文件必须以 `---` 开头'],
    };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FM) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return {
      data: {},
      body: src,
      errors: ['front-matter 未闭合：缺少结束的 `---`'],
    };
  }

  const data = {};
  const errors = [];

  for (let i = 1; i < end; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    // 键必须是行首的标识符；这也保证了 `url: https://...` 只在第一个冒号处分割
    const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(raw);
    if (!m) {
      if (/^\s/.test(raw)) {
        errors.push(`第 ${i + 1} 行：front-matter 不支持嵌套缩进 —— ${trimmed}`);
      } else {
        errors.push(`第 ${i + 1} 行：无法解析 —— ${trimmed}`);
      }
      continue;
    }

    const key = m[1];
    const value = m[2].trim();

    if (value === '') {
      errors.push(
        `第 ${i + 1} 行：字段 \`${key}\` 值为空。front-matter 不支持嵌套结构，请写成 \`${key}: 值\``,
      );
      continue;
    }
    if (value.startsWith('|') || value.startsWith('>')) {
      errors.push(
        `第 ${i + 1} 行：字段 \`${key}\` 使用了块标量（${value[0]}），front-matter 不支持多行字符串`,
      );
      continue;
    }
    if (value.startsWith('[')) {
      if (!value.endsWith(']')) {
        errors.push(`第 ${i + 1} 行：字段 \`${key}\` 的数组未闭合（缺少 \`]\`）`);
        continue;
      }
      const inner = value.slice(1, -1).trim();
      data[key] =
        inner === ''
          ? []
          : inner
              .split(',')
              .map((s) => unquote(s.trim()))
              .filter((s) => s !== '');
      continue;
    }

    data[key] = unquote(value);
  }

  return { data, body: lines.slice(end + 1).join('\n'), errors };
}

function unquote(s) {
  if (s.length >= 2) {
    const head = s[0];
    const tail = s[s.length - 1];
    if ((head === '"' && tail === '"') || (head === "'" && tail === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/** front-matter 字段的规范书写顺序，保证 diff 稳定。 */
const FIELD_ORDER = ['id', 'title', 'category', 'tags', 'difficulty', 'status', 'url', 'date'];

/**
 * 序列化为 front-matter 区块（含首尾 `---`，不含尾随换行）。
 * @param {Record<string, string|string[]>} data
 */
export function stringifyFrontmatter(data) {
  const keys = Object.keys(data);
  const ordered = [
    ...FIELD_ORDER.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !FIELD_ORDER.includes(k)),
  ];

  const lines = [FM];
  for (const k of ordered) {
    const v = data[k];
    lines.push(`${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`);
  }
  lines.push(FM);
  return lines.join('\n');
}

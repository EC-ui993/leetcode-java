/**
 * 通用小工具：日期、slug、题号补零。
 */

/**
 * 返回**本地时区**的 YYYY-MM-DD。
 *
 * ⚠️ 刻意不使用 `toISOString().slice(0, 10)`：那取的是 UTC 日期，
 * 在 UTC+8 时区的 00:00–08:00 会把日期记成前一天。
 */
export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 规范化 slug：转小写、空白转连字符。**不做截断** —— 必须与 LeetCode slug 一致。 */
export function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '-');
}

/** 题号左补零到至少四位；超过四位则原样保留。 */
export function padNum(n) {
  return String(n).padStart(4, '0');
}

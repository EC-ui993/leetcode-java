/*
 * lc-0242 有效的字母异位词
 * 分类：01-array-hash | 难度：Easy | 状态：独立完成 | 日期：2026-09-19
 * 原题：https://leetcode.cn/problems/valid-anagram/
 *
 * 思路：
 * 复杂度：时间 O(k)，空间 O(1)
 *
 * 两条铁律：
 *   1. 不要写 package 声明 —— 写了 LeetCode 提交会直接报错
 *   2. 备选解法若要独立保留，另建 SolutionAlt.java（类名 SolutionAlt）
 */
class Solution {
    public boolean isAnagram(String s, String t) {
        if(s.length() != t.length()){
            return false;
        }
        int[] table = new int[26];
        for(int i=0;i<s.length();i++){
            table[s.charAt(i) - 'a']++;
        }
        for(int i=0;i<t.length();i++){
            table[t.charAt(i) - 'a']--;
            if(table[t.charAt(i) - 'a'] < 0) return false;
        }
        return true;
    }
}

/*
 * lc-0242 有效的字母异位词 | 时间 O(k)，空间 O(1)
 * 思路：26 格计数表记录 s 的字母频次，再用 t 逐个抵消；长度相等保证计数总和为 0，只需检查是否变负
 * 详见 README.md
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

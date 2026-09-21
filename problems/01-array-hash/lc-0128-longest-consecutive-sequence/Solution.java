/*
 * lc-0128 最长连续序列 | 时间 O(n)，空间 O(n)
 * 思路：全部入哈希集合；只从「起点」（集合里没有 num-1）往后数，避免重复扫描
 * 详见 README.md
 */

import java.util.HashSet;
import java.util.Set;

class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for(int num:nums){
            set.add(num);
        }
        int longestConsecutive = 0;
        for(int num:set){
            if(!set.contains(num-1)){
                int currentConsecutive = 1;
                int currentNum = num;
                while(set.contains(currentNum+1)){
                    currentNum++;
                    currentConsecutive++;
                }
                longestConsecutive = Math.max(longestConsecutive,currentConsecutive);
            }
        }
        return longestConsecutive;
    }
}

/*
 * lc-0015 三数之和 | 时间 O(n²)，空间 O(log n)
 * 思路：排序后固定一个数，剩下两数用对撞双指针；三层都要跳过重复元素
 * 详见 README.md
 */

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        Arrays.sort(nums);
        for(int k=0;k<nums.length-2;k++){
            if(nums[k] > 0) break;
            if(k>0 && nums[k] == nums[k-1]) continue;
            int i = k+1;
            int j = nums.length - 1;
            while(i<j){
                int sum = nums[k] + nums[i] + nums[j];
                if(sum < 0){
                    i++;
                }
                else if(sum > 0){
                    j--;
                }
                else{
                    res.add(new ArrayList<>(Arrays.asList(nums[k],nums[i],nums[j])));
                    while(i < j && nums[i] == nums[i+1]){
                        i++;
                    }
                    while(i < j && nums[j] == nums[j-1]){
                        j--;
                    }
                    i++;
                    j--;
                }
            }
        }
        return res;
    }
}

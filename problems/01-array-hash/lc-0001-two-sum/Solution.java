import java.util.HashMap;

/*
 * lc-0001 两数之和 —— 最优解
 * 时间 O(n)，空间 O(n)
 *
 * 注意：不要写 package 声明，否则 LeetCode 提交会直接报错。
 */
class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];

            if (map.containsKey(need)) {
                return new int[] { map.get(need), i };
            }

            map.put(nums[i], i);
        }
        return new int[] { -1, -1 };
    }
}

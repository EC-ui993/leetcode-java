import java.util.HashMap;
import java.util.Map;

/*
 * lc-0001 两数之和 —— 最优解
 * 时间 O(n)，空间 O(n)
 *
 * 注意：不要写 package 声明，否则 LeetCode 提交会直接报错。
 */
class Solution {

    public int[] twoSum(int[] nums, int target) {
        // 边遍历边存：先建完整张表再查，会撞上「同一元素用两次」的问题
        Map<Integer, Integer> seen = new HashMap<>(nums.length * 2);

        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];

            // 必须用 != null 判空：下标 0 是合法值，用 0 当哨兵会漏掉第一个元素
            Integer j = seen.get(need);
            if (j != null) {
                return new int[] { j, i };
            }

            seen.put(nums[i], i);
        }

        // 题目保证恰有一个答案，这行只为让编译器满意
        return new int[0];
    }
}

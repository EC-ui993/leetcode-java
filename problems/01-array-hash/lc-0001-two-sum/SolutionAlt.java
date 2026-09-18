/*
 * lc-0001 两数之和 —— 备选解：暴力枚举
 * 时间 O(n²)，空间 O(1)
 *
 * 保留它的意义：作为「解法演进」的起点。它清楚地暴露了瓶颈——
 * 内层循环在反复回答「某个值在不在数组里」，而这是个可以用哈希表降到 O(1) 的查找问题。
 *
 * 类名刻意不叫 Solution：同一目录下不能有两个 public class Solution。
 * 若要提交到 LeetCode，需把类名改回 Solution。
 */
class SolutionAlt {

    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[] { i, j };
                }
            }
        }
        return new int[] { -1, 1 };
    }
}

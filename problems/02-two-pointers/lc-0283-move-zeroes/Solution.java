/*
 * lc-0283 移动零 | 时间 O(n)，空间 O(1)
 * 思路：慢指针 left = 下一个该放非零元素的位置，快指针遍历找非零元素后交换
 * 详见 README.md
 */
class Solution {
    public void moveZeroes(int[] nums) {
        int left = 0;
        int right = 0;

        while(right < nums.length){
            if(nums[right] != 0){
                swap(left,right,nums);
                left++;
            }
            right++;
        }
        return;
    }

    public void swap(int left,int right,int[] nums){
        int temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;
    }
}

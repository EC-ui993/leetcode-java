/*
 * lc-0167 两数之和 II - 输入有序数组 | 时间 O(n)，空间 O(1)
 * 思路：两端向中间收缩，和偏大就排除右端、偏小就排除左端——每步都能永久扔掉一个元素
 * 详见 README.md
 */
class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int l = 0;
        int r = numbers.length - 1;
        while(l<r){
            if(numbers[l] + numbers[r] == target) return new int[]{l+1,r+1};
            if((numbers[l] + numbers[r]) < target) l++;
            else r--;
        }
        return new int[]{-1,-1};
    }
}

/*
 * lc-0011 盛最多水的容器 | 时间 O(n)，空间 O(1)
 * 思路：对撞双指针，每步只移动较矮的一端——移高的那端宽变小且高不会变大，是无用功
 * 详见 README.md
 */
class Solution {
    public int maxArea(int[] height) {
        int max = 0;
        int left = 0;
        int right = height.length -1;
        while(left<right){
            int cur = (right-left)*Math.min(height[left],height[right]);
            max = Math.max(cur,max);
            if(height[left]<=height[right]){
                left++;
            }else{
                right--;
            }
        }
        return max;
    }
}

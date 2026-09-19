import java.util.Arrays;

class Solution {
    public boolean isAnagram(String s, String t) {
        char[] chars1 = s.toCharArray();
        Arrays.sort(chars1);
        String a = new String(chars1);
        char[] chars2 = t.toCharArray();
        Arrays.sort(chars2);
        String b = new String(chars2);
        return (a.equals(b));
    }
}
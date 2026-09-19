/*
 * lc-0242 有效的字母异位词 —— 备选解：排序后比较
 * 时间 O(k log k)，空间 O(k)
 * 类名刻意不叫 Solution：同一目录下不能有两个 Solution（javac 会报 duplicate class）
 */
import java.util.Arrays;

class SolutionAlt {
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
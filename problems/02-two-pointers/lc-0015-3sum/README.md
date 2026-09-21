---
id: lc-0015
title: 三数之和
category: 02-two-pointers
tags: [双指针, 数组, 排序]
difficulty: Medium
status: 看题解完成
url: https://leetcode.cn/problems/3sum/
date: 2026-09-21
---

# lc-0015 三数之和

## 思路

经过排序之后才能靠sum大小排除一端，然后先定一个数，剩下两个数用双指针排查，去重：最先定的数遇到开头值和下一个值跳过，双指针找到一组后，left和right都跳过相同值，最后再往中间一位定位到最近的不同值

## 复杂度

- 时间：O(n²)
- 空间：O(log n)

## 解法演进

刚开始想用target = 0 - 最先定的数，后面发现不能去重，看了题解知道怎么处理去重

## 踩坑

- 没考虑到如何处理去重，第一个数大于0的特殊情况也没考虑到，不会Arrays.asList(nums[k],  nums[i],nums[j])这个用法 得到答案数组
- 复制代码到仓库时按vscode提示把 `new ArrayList<>()` 手改成了 `new List<>()`
-  VS Code 报「找不到 List」时弹出「创建类」的快速修复，
  点下去生成了个空壳 `List.java`，反而把 `java.util.List` 顶替掉，
  报错变成看不懂的「找不到方法 add」。**正确做法是加 import，不是建类**

## 关联题

- lc-0001（两数之和）
- lc-0016（最接近的三数之和）
- lc-0018（四数之和）
- lc-0167（两数之和 II - 输入有序数组）

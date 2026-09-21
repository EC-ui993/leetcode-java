---
id: lc-0167
title: 两数之和 II - 输入有序数组
category: 02-two-pointers
tags: [双指针, 数组]
difficulty: Medium
status: 独立完成
url: https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/
date: 2026-09-21
---

# lc-0167 两数之和 II - 输入有序数组

## 思路

题目给出有序的条件，而且用双指针遍历时间复杂度比暴力双层遍历低，O(n²)降到了O(n)

## 复杂度

- 时间：O(n) —— 左右指针一共最多走 n 步
- 空间：O(1) —— 只用两个指针变量，与 n 无关

## 解法演进

一开始就是用双指针

## 踩坑

一开始没注意下标从1开始算，返回结果的时候没+1

## 关联题

- lc-0001（两数之和）
- lc-0011（盛最多水的容器）
- lc-0015（三数之和）
- lc-0283（移动零）

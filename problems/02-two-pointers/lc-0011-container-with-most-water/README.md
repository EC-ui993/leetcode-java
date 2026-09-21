---
id: lc-0011
title: 盛最多水的容器
category: 02-two-pointers
tags: [双指针, 数组, 贪心]
difficulty: Medium
status: 看题解完成
url: https://leetcode.cn/problems/container-with-most-water/
date: 2026-09-21
---

# lc-0011 盛最多水的容器

## 思路

水的体积等于底乘较短的那条边，而想要盛水量更多只可能移动较短的那条边，因为移动的时候底的值会降低，移动较高的边必然盛水量更少

## 复杂度

- 时间：O(n)
- 空间：O(1)

## 解法演进

看了题解思路之后用双指针做出来

## 踩坑

当时没想到移动较短边这个点

## 关联题

- lc-0042（接雨水）
- lc-0015（三数之和）
- lc-0167（两数之和 II - 输入有序数组）
- lc-0283（移动零）

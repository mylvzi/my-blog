---
title: "二分查找进阶：如何优雅地寻找左右边界（LeetCode 34 详解）"
date: 2026-03-30 12:00:00
tags:
  - algorithm
  - leetcode
  - binary-search
categories:
  - 技术
comment: true
summary: "用 LeetCode 34 讲透二分查找中左右边界的两种经典写法。"
---

> 本文以 [34. 在排序数组中查找元素的第一个和最后一个位置 - 力扣（LeetCode）](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/description/)为例讲解二分查找算法“寻找左右区间边界”的实现
# 0. 前言-朴素二分查找回顾
  ```java
  public int binarySearch(int[] nums, int target) {
  		int n = nums.length, l = 0, r = n - 1;
  		while(l <= r) {
  			int mid = l + (r - l) / 2;
  			if(nums[mid] < target) l = mid + 1;
  			else if(nums[mid] > target) r = mid - 1;
  			else return mid; 
  		}
  		
  		return -1; // 数组不存在目标值
  }
  ```
* `细节一：` 区间是[l, r] 左闭右闭
* `细节二：` 当 l == r 时，区间仍然包含一个有效元素 nums[l]，因此必须继续判断

# 一. 题目讲解
## 1. 描述
给你一个按照非递减顺序排列的整数数组 `nums`，和一个目标值 `target`。请你找出给定目标值在数组中的开始位置和结束位置。
如果数组中不存在目标值 `target`，返回 `[-1, -1]`。
你必须设计并实现时间复杂度为 `O(log n)` 的算法解决此问题。
**示例 1：**
**输入**nums = [5,7,7,8,8,10], target = 8
**输出:**[3,4]
**示例 2：**
**输入**nums = [5,7,7,8,8,10], target = 6
**输出：**[-1,-1]
**示例 3：**
**输入**nums = [], target = 0
**输出**[-1,-1]

## 2. 分析
识别关键点：
1. 非递减顺序查找-->联想到二分查找
2. 时间复杂度 O（logN）-->确定是二分查找
但题目要返回的是 `区间端点`，不同于朴素的二分查找是找一个确定的位置

如何实现：
	思路其实也很简单，假设存在重复元素，我们可以利用二分查找算法，在第一次=mid 时不跳出循环，而是不断缩小区间范围，直到找到合适的位置，根据左右区间端点的区分，选择**不同的缩小区间的策略**
## 3. 代码实现
```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        // 传统的二分查找做法 左闭右闭
        // 关键在于:找到之后不停下来,而是继续缩小范围
        // 使用res保留找到的结果
        int[] ret = new int[2];
        int res = -1, l = 0, n = nums.length, r = n - 1;

        // 1.找左端点
        while(l <= r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] < target) l = mid + 1;
            else if(nums[mid] > target) r = mid - 1;
            else {
            	// =mid，不跳出循环，而是缩小区间范围
                res = mid;
                r = mid - 1; // 继续往左找
            }
        }

        // res == -1 表示根本找不到符合目标的元素
        if(res == -1) return new int[]{-1, -1};

        ret[0] = l; // 找到目标值，直接赋值
        l = 0; r = n - 1;

        // 2.找右端点
        while(l <= r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] < target) l = mid + 1;
            else if(nums[mid] > target) r = mid - 1;
            else {
            	// =mid，不跳出循环，而是缩小区间范围
                res = mid;
                l = mid + 1; // 继续往右找
            }
        }

        ret[1] = r; // 找到目标值，直接赋值
        return ret;
    }
}
```
* `ret[0] = l;`： 循环结束后，l 指向的是第一个 ≥ target 的位置，也就是左边界
# 二. 另一种做法（C++ STL 的实现）
在 C++的 STL 中有两个经典的用于查找**非递减数组**左右区间端点的函数：
* lower_bound: 查找第一个 `>=target` 的元素的下标
* upper_bound: 查找第一个 `>target` 元素的下标

> Lower_bound 实现
```java
public int lowerBound(int[] nums, int target) {
		int n = nums.length, l = 0, r = n;
		while(l < r) {
			int mid = l + (r - l) / 2;
			if(nums[mid] < target) l = mid + 1;
			else r = mid;
		}
		
		return l;
} 
```
* `细节一：` 区间是[l, r), 左闭右开
* `细节二：` 循环结束条件**l<r**

对于细节一的理解：
	最开始 r 的取值就是 n 而不是朴素二分查找的 n-1, 这样做的好处是**在数组内部无论是否找到 target，都可以返回一个可插入的位置**；比如 target 值比整个数组元素都大，如果是朴素二分查找，找不到，会直接返回-1，而对于 lower_bound，是返回 n，表示**尾插**；也可以说：朴素二分查找的目标是"判断是否存在"

对于细节二的理解：
	既然区间是左闭右开，r 所表示的位置其实是一个**无效的位置**，当 l=r 时，表示有效区间内部的元素为 0，就不需要判断了；而且，如果判断的话，会陷入死循环

> Upper_bound 实现
```java
public int uperBound(int[] nums, int target) {
		int n = nums.length, l = 0, r = n;
		while(l < r) {
			int mid = l + (r - l) / 2;
			if(nums[mid] <= target) l = mid + 1;
			else r = mid;
		}
		
		return r;
} 
```
* 思路同 lower_bound, 只需要记得，upper_bound 找的是**第一个大于 target 元素的下标值**，r 最终会走到此位置

> 这种做法的好处？

最大的好处是可以实现**统一**，在 c++的 stl 容器中存在大量的需要插入元素的容器、场景，使用这种二分查找算法，可以实现**工程上统一**

> 如何应用到本题

了解了 lower_bound 和 upper_bound 的实现，可以很容易迁移到本题
```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        // c++ stl : lower bound  upper bound
        // 核心思想:无论target是否存在,都会返回一个"插入位置"
        int[] ret = new int[]{-1, -1};
        int n = nums.length, l = 0, r = n;
        if(n == 0) return ret;

        // lower bound  找的是:第一个>= target
        while(l < r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] < target) l = mid + 1;
            else r = mid; // ==mid 可能是正确答案,不能舍弃
        }

        // l有可能走到n的位置
        if(l == n || nums[l] != target) return new int[]{-1, -1};
        ret[0] = l;

        l = 0; r = n;
        // upper bound  找的是:第一个>target的位置
        while(l < r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] <= target) l = mid + 1;
            else r = mid; // ==mid 可能是正确答案,不能舍弃
        }

        ret[1] = r - 1;
        return ret;
    }
}
```
* `ret[1] = r - 1: ` upper_bound 找的是第一个>target 的下标，-1 刚好是最后一个>=target 的元素的下标

# 三. 一些后话

刚开始学习这道题目时，由于想不出思路就直接看的题解，当时题解的做法和我刚学习到的朴素二分查找很不一样，它使用的就是上述说的 C++ STL 中的实现，有一些细节我后面想了很久都没理解（比如为什么是开区间，为什么循环结束条件是 l < r）

今天写的时候还是忘记思路了，让 gpt 重新给我讲了下，他是用朴素二分的思路写的，看到解法后茅塞顿开，再去理解 stl 中的解法也变得很简单，看来任何学习都要循序渐进啊~ 


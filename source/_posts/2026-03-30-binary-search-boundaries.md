---
title: 二分查找算法系列-概念讲解-应用场景-大量例题讲解
date: 2026-03-30 12:00:00
tags:
  - algorithm
  - leetcode
  - binary-search
categories:
  - 技术
comment: true
summary: 二分查找的三种固定模板，结合多道题目梳理左右端点查找的使用场景。
---

二分查找算法是时间复杂度为 `O(logN)` 的搜索算法，常用于处理 `在有序数组中查找元素` 的相关题目，核心思路十分固定，大致可以分为三种类型:

1. 朴素二分查找
2. 查找左端点的二分查找
3. 查找右端点的二分查找

# 一.朴素二分查找
`模版`

```java
    public int search(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while(left <= right) {
            int mid = left + (right - left) / 2;
            if(arr[mid] > target) right = mid - 1;
            else if(arr[mid] < target) left = mid + 1;
            else return mid;
        }
        return -1;
    }
```

说明：
1. 为什么是 `left <= right`? 因为当 left 和 right 处于同一个位置时，得到的才是要查找的元素
2. 为什么 `mid = left + (right - left) / 2`? 其实 mid 的计算方式有两种，一种是代码所写的，另一种是 `mid = left + (right - left + 1) / 2`，这两种写法的区别在于 `当集合元素的数量为偶数时,所指的位置不同`

![在这里插入图片描述](/images/posts/binary-search/img_01.png)

这种区别在朴素二分查找中并不会体现，两种方式都是成立的

最大的区别在于这里集合并不是完全降序/升序的，是存在平直路段的，这些平直路段要查找他们的起始位置和终止位置，而不是像朴素二分一样在一个完全升序/降序的区间内查找某一个数字

左端点:
`left < right`
1. left == right 时，就是最终结果，无需判断
2. 判断会带来死循环，因为 right = mid

# 二.查找左端点
![在这里插入图片描述](/images/posts/binary-search/img_02.png)

`说明`
1. `right = mid`，是为了处理 mid 刚好就是要查找的元素，如果 `right = mid - 1`，就不是左端点了
2. `right = mid`，为了防止死循环，mid 要落到 left 头上，所以在计算中点是使用 `mid = l + (r-l)/2`

# 三.查找右端点
![在这里插入图片描述](/images/posts/binary-search/img_03.png)

`说明`
1. `left = mid`，是为了处理 mid 刚好就是要查找的元素，如果 `left = mid + 1`，就不是右端点了
2. `left = mid`，为了防止死循环，mid 要落到 right 头上，所以在计算中点是使用 `mid = l + (r-l+1)/2`

# 四.例题讲解

**题目一**:[正整数和负整数的最大计数](https://leetcode.cn/problems/maximum-count-of-positive-integer-and-negative-integer/description/)

**分析**
* 注意本题的数组顺序是 **非递减**
* 完成两个操作就能得到答案
  1. 找到负数最大值的下标(找右端点)
  2. 找到正数最小值的下标(找左端点)

![在这里插入图片描述](/images/posts/binary-search/img_04.png)

`注意`: 数组元素全部 >0 或 <0 的情况

**代码**

```java
class Solution {
    public int maximumCount(int[] nums) {
        int n = nums.length, i1 = -1, i2 = -1, l = 0, r = n - 1, ret = 0;

        // 1.右端点
        while(l < r) {
            int mid = l + (r - l + 1) / 2;
            if(nums[mid] >= 0) r = mid - 1;
            else l = mid;
        }

        if(nums[l] >= 0) i1 = 0;// 全为正数  负数的个数为0
        else i1 = l + 1;

        // 2.左端点
        l = 0; r = n - 1;
        while(l < r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] <= 0) l = mid + 1;
            else r = mid;
        }
        if(nums[r] <= 0) i2 = 0;// 全为负数  正数的个数为0
        else i2 = n - r;

        return Math.max(i1, i2);
    }
}
```

---
相似题目1:[在排序数组中查找元素的第一个和最后一个位置](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/description/)

**代码**

```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int[] ret = new int[2];
        ret[0] = ret[1] = -1;
        int n = nums.length, l = 0, r = n - 1;
        if(n == 0) return new int[]{-1,-1};

        // 1.左端点
        while(l < r) {
            int m = l + (r - l) / 2;
            if(nums[m] < target) l = m + 1;
            else r = m;
        }

        if(nums[l] == target) ret[0] = l;
        else return ret;

        l = 0; r = n - 1;
        // 2.右端点
        while(l < r) {
            int m = l + (r - l + 1) / 2;
            if(nums[m] <= target) l = m;
            else r = m - 1;
        }

        ret[1] = r;
        return ret;
    }
}
```

---

相似题目2:[统计有序矩阵中负数的个数](https://leetcode.cn/problems/count-negative-numbers-in-a-sorted-matrix/submissions/538660026/)

分析: 对每一个一维数组做一次查找左端点即可(`O(m + n)`)

**代码**

```java
class Solution {
    public int countNegatives(int[][] grid) {
        int m = grid.length, n = grid[0].length, ret = 0;
        for(int[] k : grid) {
            int l = 0, r = n - 1;
            while(l < r) {
                int mid = l + (r - l) / 2;
                if(k[mid] >= 0) l = mid + 1;
                else r = mid;
            }

            if(k[r] >= 0) ret += 0;
            else ret += n - r;
        }

        return ret;
    }
}
```

---
相似题目3:[第一个错误的版本](https://leetcode.cn/problems/first-bad-version/description/)(找左端点)

---
**题目2**:[搜索插入的位置](https://leetcode.cn/problems/search-insert-position/submissions/538668875/)

* 关于二分算法的一个重要结论: `对于二分查找算法，如果在有序数组中找不到目标值，那么 left 指针最终会位于比目标值大且离目标值最近的位置。`

![在这里插入图片描述](/images/posts/binary-search/img_05.png)

**代码**

```java
class Solution {
    public int searchInsert(int[] nums, int target) {
        // 左端点
        int n = nums.length, l = 0, r = n - 1;
        while(l <= r) {
            int mid = l + (r - l) / 2;
            if(nums[mid] < target) l = mid + 1;
            else if(nums[mid] > target) r = mid - 1;
            else return mid;
        }

        return l;
    }
}
```

> 一开始想的是寻找区间的左端点，但是发现有很多种特殊情况需要判断，而且如果按照自己的思路，其实查找左/右端点都行，但是都不是正确思路

---

**题目3：**[点名](https://leetcode.cn/problems/que-shi-de-shu-zi-lcof/)

`二分解法`:
* 利用 `二段性`，缺失数字之前的所有数字，`下标与其对应的数字相等`; 缺失数字之后的所有数字，`下标与其对应的数字不等`;

**代码**

```java
class Solution {
    public int takeAttendance(int[] records) {
        int n = records.length, l = 0, r = n - 1;
        while(l < r) {
            int mid = l + (r - l) / 2;
            if(records[mid] == mid)l = mid + 1;
            else r = mid;
        }

        return l == records[l] ? l + 1 : l;// 处理细节问题  缺失的数字是数组中最后一个数字的下一位
    }
}
```

**题目四**:[寻找峰值](https://leetcode.cn/problems/find-peak-element/)

![在这里插入图片描述](/images/posts/binary-search/img_06.png)

```java
class Solution {
    public int findPeakElement(int[] arr) {
        // 查找左端点
        int n = arr.length, l = 0, r = n - 1;
        if(n == 1) return 0;
        while(l < r) {
            int mid = l + ((r - l) >> 1);
            if(arr[mid + 1] > arr[mid]) l = mid + 1;
            else r = mid;
        }

        return l;
    }
}
```


**题目五**:[寻找峰值II](https://leetcode.cn/problems/find-a-peak-element-ii/description/)

**分析**
* 本题的思考难点是如何实现题目所说 `O(m log(n)) 或 O(n log(m))` 时间复杂度，一看到带 log 又是查找相关的算法，想到大概率是要使用二分查找算法，再加上 `寻找峰值I` 中就使用了 `二分查找算法`，如何迁移到本题呢? 如何将一维解决方案扩展到二维呢? 其实这些题目最关键的突破点在于要深刻理解 `二维数组是一维数组的数组`，二维数组的每一个元素都是一个一维数组

**代码**

```java
class Solution {
    // 二维的二分查找算法  多了一个找中间列最大值将二维数组顺时针旋转90°瞬间就能理解
    public int[] findPeakGrid(int[][] mat) {
        int m = mat.length, n = mat[0].length, l = 0, r = n - 1;
        while(l <= r) {
            int midCol = l + ((r - l) >> 1);
            int maxRow = 0;

            // 找出中间列最大值所在的行
            for(int i = 0; i < m; i++)
                if(mat[i][midCol] > mat[maxRow][midCol])
                    maxRow = i;

            // 判断左边和右边的数是否大于当前的数
            boolean isLeftGreater = (midCol - 1 >= 0 && mat[maxRow][midCol - 1] > mat[maxRow][midCol]);
            boolean isRightGreater = (midCol + 1 < n && mat[maxRow][midCol + 1] > mat[maxRow][midCol]);

            if(!isLeftGreater && !isRightGreater) return new int[]{maxRow, midCol};
            else if(isLeftGreater) r = midCol - 1;
            else l = midCol + 1;
        }

        // 照顾编译器
        return new int[]{-1, -1};
    }
}
```

![在这里插入图片描述](/images/posts/binary-search/img_07.png)

`总结`:
* 对于二分查找的算法来说，难点在于的是识别出题目中 `隐含的二段性`，有些二段性不容易识别，比如 `寻找缺失的数字`，其二段性体现在下标与数字之间的关系；比如寻找峰值这道题目，二段性体现在与其周围数字之间的大小关系上;
* 分析出二段性之后，判断是寻找左端点还是右端点；有的题目是左右端点都可以，有的只能在一端，具体问题具体分析
* 注意查找左端点和查找右端点的两个注意事项，中点的计算，谁等于 mid
* 多画图更好理解二段性

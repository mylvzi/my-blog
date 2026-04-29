---
title: 递归入门：如何理解递归与经典题目解析
date: 2026-04-29 09:40:00
tags:
  - algorithm
  - recursion
  - leetcode
categories:
  - 技术
comment: true
summary: 从二叉树遍历的直觉切入，结合汉诺塔、链表、快速幂等题目理解递归的分析方式、函数设计与递归出口。
---

# 一.如何理解递归

递归对于初学者来说是一个非常抽象的概念,笔者在第一次学习时也是迷迷糊糊的(二叉树遍历),递归的代码看起来非常的`简洁,优美`,但是如何想出来递归的思路或者为什么能用递归这是初学者很难分析出来的

笔者在学习的过程中通过刷题,也总结出自己的一些经验,总结来说就是要`胆大心细,宏观看待问题`

其实很多递归的问题如果从宏观的角度去看,其实特别简单,比如二叉树的后序遍历,他无非就是:
1. 你先给我一个根节点
2. 访问根节点的左子树
3. 访问根节点的右子树
4. 再打印当前节点的值

对于每一个节点的操作都是相同的,如果从宏观的角度看,我们可以把一个复杂的二叉树想象成一个只有三个节点的二叉树
![在这里插入图片描述](/images/posts/recursion-intuition/img_01.png)
把二叉树的后序遍历就当做访问这个`只有三个节点`的二叉树,按照`左右根`的顺序遍历

```java
dfs(TreeNode root) {
	if(root == null) return;
	
	dfs(root.left);// 访问左节点
	dfs(root.right);// 访问右结点
	println(root.val);// 打印当前节点的值
}
```

大致总结下来递归问题的思路如下:
1. `分析:`根据题目分析,判断是否有`重复的子问题`,如果有,就可以利用递归解决,设计出`函数头`,从宏观的角度想,要完成这次操作,这个"接口"需要什么参数(二叉树的遍历需要root,快排需要一个数组和开始结束位置)
2. `设计函数体:`只关注某一个子问题的具体操作,比如二叉树的后序遍历的子问题就完成三步:访问左子树,访问右子树,打印当前节点
3. `递归出口:`确定好递归出口,将子问题分割到最小单元进行确定,比如二叉树的遍历当节点为空时就不需要再去执行任何操作了,直接返回即可,`快排`,分割到数组只有一个数字或者为空时(l >= r)就不需要继续分治了


# 二.例题解析:
## 1.汉诺塔问题
链接:https://leetcode.cn/problems/hanota-lcci/description/

**分析:**
1. `函数头`:给我三个柱子和盘子数
2. `函数体`:先借助c将a上的n-1个盘子移动到b,然后将a剩余的最大的盘子移动到c,再借助a,将b上的n-1个盘子移动到c
3. `递归出口`:当只有一个盘子的时候,直接移动
![在这里插入图片描述](/images/posts/recursion-intuition/img_02.png)

**代码:**

```java
class Solution {
    public void hanota(List<Integer> A, List<Integer> B, List<Integer> C) {
        int n = A.size();
        dfs(A,B,C,n);
    }

    private void dfs(List<Integer> a, List<Integer> b, List<Integer> c,int n) {
        // 递归结束条件 只有一个盘子的时候直接移动
        if(n == 1) {
            c.add(a.remove(a.size() - 1));
            return;
        }

        // 模拟:借助c,将a上的n-1个盘子移动到b上
        dfs(a,c,b,n-1);
        // 将最大的盘子移动到c上
        c.add(a.remove(a.size() - 1));
        // 模拟:借助a,将b盘上的n-1个盘子移动到c上
        dfs(b,a,c,n-1);
    }
}
```

## 2.合并两个有序链表
**链接:** https://leetcode.cn/problems/merge-two-sorted-lists/

**分析:**
1. `函数头`:两个链表的头结点
2. `函数体`:判断较小值,合并之后的所有节点,并连接返回的节点
3. `递归出口`:只有一个节点或者为空
![在这里插入图片描述](/images/posts/recursion-intuition/img_03.png)

**代码:**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        // 递归
        if(list1 == null) return list2;
        if(list2 == null) return list1;

        // 将后面的链表给我合并好,并且返回合并好的节点
        if(list1.val < list2.val) {
            list1.next = mergeTwoLists(list1.next,list2);
            return list1;
        }else {
            list2.next = mergeTwoLists(list2.next,list1);
            return list2;
        }
    }
}
```

## 3.反转链表
**链接:** https://leetcode.cn/problems/reverse-linked-list/submissions/514361305/

**分析:**

1. `函数头`:给我头结点,逆序整个链表
2. `函数体`:逆序之后的所有节点,并且返回逆序之后的头结点,然后和当前节点拼接
3. `递归出口`:只有一个节点或者为空
![在这里插入图片描述](/images/posts/recursion-intuition/img_04.png)

**代码:**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {

        // 递归出口
        if(head == null || head.next == null) return head;

        // 函数体  你给我逆置后面的所有链表并且返回新的头结点
        ListNode newhead = reverseList(head.next);

        // 反转
        head.next.next = head;
        head.next = null;

        return newhead;
    }
}
```
## 4.两两交换链表中的节点
**链接:** https://leetcode.cn/problems/swap-nodes-in-pairs/

**分析:**
1. `函数头`:重复子问题就是`给我一个节点,两两交换后面的链表的所有节点`
2. `函数体`:关注每一个子问题要干什么,得到交换后的头节点,然后链接这个头结点
3. `递归出口`:空或者只有一个节点
![在这里插入图片描述](/images/posts/recursion-intuition/img_05.png)

**代码:**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode swapPairs(ListNode head) {

        if(head == null || head.next == null) return head;
        ListNode ret = head.next;// 最终要返回的节点应该是head.next(是头结点的下一个节点)

        ListNode newHead = swapPairs(head.next.next);

        head.next.next = head;
        head.next = newHead;

        return ret;

    }
}
```
## 5.Pow（x, n）- 快速幂
**链接:** https://leetcode.cn/problems/powx-n/submissions/514390268/

**分析:**
1. `函数头`:结合快速幂的思想,递归函数就是求`x ^ n`的值
2. `函数体`:每一个子问题的操作,得到 `x ^ n / 2`的值,再判断返回的结果的值
3. `递归出口`:n == 0

![在这里插入图片描述](/images/posts/recursion-intuition/img_06.jpeg)
**代码**:

```java
class Solution {
    public double myPow(double x, int n) {
        // 注意n可能为负数
        return n < 0 ? 1.0 / pow(x,-n) : pow(x,n);
    }

    public double pow(double x,int n) {
        if(n == 0) return 1.0;
        double tmp = pow(x,n/2);
        return n % 2 == 0 ? tmp * tmp : tmp * tmp * x;
    }
}
```

当前这个数的结果只有在遍历完当前数字的`n / 2`之后才能获得,所以需要先递归`x,n / 2`

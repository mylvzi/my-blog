---
title: "从页面置换策略到 LeetCode：LRU 与 LFU 缓存的设计"
date: 2026-04-27
draft: false
tags: ["algorithm", "os", "cache", "leetcode"]
categories: ["技术"]
summary: "从操作系统页面置换切入，系统梳理 LRU 与 LFU 的设计思路与实现细节。"
---

今天翻到《操作系统导论》（Operating Systems: Three Easy Pieces）里讲页面置换的那一章，忽然觉得书上的理论与 LeetCode 上的题目产生了奇妙的联结。虚拟内存管理中的“该换出哪一页”，和工程中随处可见的缓存淘汰策略，本质上在问同一个问题：**如何用有限的空间，接住未来无限且不可预知的访问序列？** 有没有想到 CPU 调度算法的 MLFQ?

## 一点背景：页交换与局部性

操作系统在虚拟内存中为每个进程维护一个**页表**。进程看到的是一个巨大的虚拟地址空间, 虚拟地址空间的页称为 **VPN（Virtual Page Number）**，物理内存中的页帧则称为 **PPN（Physical Page Number）**。物理内存是所有进程的公共资源，当物理内存吃紧时(缺页异常Page Fault)，操作系统必须挑选一些物理页帧写回磁盘，把腾出来的帧分给急需的进程。这个动作叫做**页交换**，挑选牺牲帧的策略就是**页面置换算法**。

为什么置换策略能工作？答案藏在**局部性原理**里。书中用两句话概括：

- **时间局部性**：最近被访问的页面，很可能在不久的将来再次被访问。
- **空间局部性**：被访问页面附近的页面，很可能马上也会被访问。

理论上，最优置换算法是：淘汰未来最晚才会被访问的页面。这个策略能最大化未来的缓存命中率。但问题是，操作系统无法预知未来。所以现实系统只能基于历史访问记录做预测。

历史经验大致有两个维度：
* 第一，近期性。越是最近被访问过的页面，越可能很快再次被访问。
* 第二，频率。越是经常被访问的页面，越可能继续被访问。

LRU 利用的是近期性，LFU 利用的是频率。二者都是局部性原理在缓存管理中的具体体现。

---
## 一、LRU：最近最少使用

LRU，全称 Least Recently Used，意思是淘汰最近最少使用的元素。

它的核心假设是：

> 最近访问过的数据，更有可能在不久之后再次被访问。

这实际上对应了局部性原理中的时间局部性。程序运行时，经常会在一段时间内反复访问同一批地址。例如循环、函数调用栈、热点对象、缓存行等，都会体现这种局部性。

在 LeetCode 的 LRU Cache 中，需要支持两个操作：

```java
get(key)
put(key, value)
```

并且要求平均时间复杂度为 `O(1)`。

这个要求直接决定了数据结构设计。

单用数组或链表不行，因为查找 key 需要 `O(n)`。

单用 HashMap 也不行，因为它只能快速找到元素，不能快速知道谁是最近最少使用的元素。

所以需要组合数据结构：

```text
HashMap + 双向链表
```

HashMap 负责根据 key 快速定位节点。

双向链表负责维护访问顺序。

链表头部表示最近使用，链表尾部表示最久未使用。每次访问一个节点，就把它移动到链表头部。每次缓存满了，就删除链表尾部的节点。

---

## 二、LRU 的节点设计

代码中的节点如下：

```java
class ListNode {
    int key, val;
    ListNode prev;
    ListNode next;

    ListNode(int key, int val) {
        this.key = key;
        this.val = val;
    }
}
```

这里必须同时保存 `key` 和 `val`。

保存 `val` 是为了返回缓存值。

保存 `key` 是为了在删除链表节点时，能够同步从 HashMap 中删除对应映射。

如果节点里没有 `key`，当我们从链表尾部删除 LRU 节点时，就不知道应该从 HashMap 里删掉哪个 entry。

这就是为什么缓存节点不只是 value，而是完整的 key-value entry。

---

## 三、为什么使用双向链表

LRU 的关键操作有两个：

```text
1. 把某个节点移动到头部
2. 删除尾部节点
```

如果使用单向链表，删除某个节点时需要知道它的前驱节点，否则无法在 `O(1)` 时间内完成删除。

双向链表的节点保存了 `prev` 和 `next`，因此可以直接断开当前节点：

```java
private void remove(ListNode node) {
    hash.remove(node.key);

    node.prev.next = node.next;
    node.next.prev = node.prev;
}
```

这一步就是把节点从链表中摘除，同时从 HashMap 中删除。

然后再把它插入到链表头部：

```java
private void insertInToFront(ListNode node) {
    hash.put(node.key, node);

    node.next = dummyHead.next;
    dummyHead.next.prev = node;

    dummyHead.next = node;
    node.prev = dummyHead;
}
```

这样，访问过的节点就会被标记为最近使用。

---

## 四、虚拟头尾节点的作用

代码里使用了两个哨兵节点：

```java
dummyHead = new ListNode(0, 0);
dummyTail = new ListNode(0, 0);

dummyHead.next = dummyTail;
dummyTail.prev = dummyHead;
```

这两个节点不存储真实数据，只是为了简化边界条件。

有了 dummyHead 和 dummyTail 之后，插入和删除逻辑就不需要额外判断：

```text
链表是否为空
删除的是不是头节点
删除的是不是尾节点
插入时是否只有一个节点
```

真实节点永远位于：

```text
dummyHead <-> real nodes <-> dummyTail
```

所以最近使用的节点是：

```java
dummyHead.next
```

最久未使用的节点是：

```java
dummyTail.prev
```

当缓存满了时，直接删除：

```java
remove(dummyTail.prev);
```

这就是 LRU 的置换动作。

---

## 五、LRU 的 get 与 put

`get` 操作分两种情况。

如果 key 不存在，说明缓存未命中：

```java
if(!hash.containsKey(key)) return -1;
```

如果 key 存在，说明缓存命中。此时不仅要返回 value，还要更新访问顺序：

```java
ListNode node = hash.get(key);
remove(node);
insertInToFront(node);
return node.val;
```

这里的“移动到头部”，在 OS 语境下可以理解为：这个页刚刚被访问过，因此它不应该成为近期被淘汰的对象。

`put` 操作也分几种情况。

如果 key 已经存在，先删除旧节点：

```java
if(hash.containsKey(key))
    remove(hash.get(key));
```

如果缓存容量已满，则删除尾部节点：

```java
if(hash.size() == capacity)
    remove(dummyTail.prev);
```

最后把新节点插入头部：

```java
insertInToFront(new ListNode(key, value));
```

这个设计保证了 `get` 和 `put` 的平均时间复杂度都是 `O(1)`。

---

## 六、LRU 与操作系统中的页面置换

从概念上看，LRU 很适合作为页面置换策略。

如果一个页面很久没有被访问，那么它将来被访问的概率可能较低。淘汰它，看上去是合理的。

但实际操作系统中，严格 LRU 并不常用。

原因很简单：维护精确的 LRU 成本太高。

每次内存访问都要更新链表位置，这意味着操作系统需要对每个页面访问维护复杂的数据结构。对于真实系统来说，这个开销不可接受。

《操作系统导论》中讲到的 Clock Algorithm，也就是时钟算法，就是对 LRU 的一种近似实现。它不维护完整的访问顺序，而是在页表项或页框元数据中维护一个 use bit，也就是使用位。

当页面被访问时，硬件或操作系统会把 use bit 置为 1。置换时，操作系统像时钟指针一样扫描页面：

```text
如果 use bit = 1，则清零并跳过
如果 use bit = 0，则选择该页淘汰
```

这不是精确 LRU，但它利用了类似的思想：最近被访问过的页面，会获得一次“续命”机会。

所以，LeetCode 中的 LRU 是一种算法题里的理想化实现，而操作系统中的页面置换则更关注实现成本和硬件协作。

---

## 七、LFU：最不经常使用

LFU，全称 Least Frequently Used，意思是淘汰访问频率最低的元素。

它的核心假设是：

> 历史上被访问次数越多的数据，将来继续被访问的可能性越高。

这和 LRU 不同。

LRU 看的是“最近有没有访问”。

LFU 看的是“总共访问了多少次”。

举个简单例子：

```text
容量 = 2

访问序列：
put(1)
get(1)
get(1)
put(2)
put(3)
```

此时 key = 1 的访问频率最高，key = 2 的访问频率最低。

如果要插入 key = 3，LFU 会淘汰 key = 2。

这说明 LFU 更偏向长期热点数据。

---

## 八、LFU 的难点：频率相同时怎么办

LFU 的核心问题不是“谁频率最低”，而是：

```text
多个 key 的频率相同，应该删谁？
```

LeetCode 题目要求：当频率相同时，淘汰最近最少使用的那个。

也就是说，LFU 内部还要嵌套 LRU。

整体策略是：

```text
先按频率淘汰
频率相同，再按最近使用时间淘汰
```

所以 LFU 的数据结构比 LRU 更复杂。

代码中使用了两个 HashMap：

```java
Map<Integer, Node> hash1; 
Map<Integer, DoublyLinkedList> hash2;
```

其中：

```text
hash1: key -> Node
hash2: freq -> DoublyLinkedList
```

`hash1` 用来根据 key 在 `O(1)` 时间内找到节点。

`hash2` 用来根据访问频率找到对应的频率桶。

每一个频率桶内部是一条双向链表，用来维护相同频率下的 LRU 顺序。

---

## 九、LFU 的节点设计

LFU 的节点比 LRU 多了一个 `freq` 字段：

```java
class Node {
    int key, val, freq;
    Node prev, next;

    Node(int key, int val, int freq) {
        this.key = key;
        this.val = val;
        this.freq = freq;
    }
}
```

其中：

```text
key: 缓存键
val: 缓存值
freq: 当前访问频率
prev / next: 双向链表指针
```

每次 `get` 一个 key，或者 `put` 更新已有 key，都要增加该节点的访问频率。

这意味着节点需要从旧频率桶中删除，再插入到新频率桶中。

例如，一个节点当前 `freq = 2`，访问一次后变成 `freq = 3`：

```text
freq = 2 的链表中删除该节点
freq = 3 的链表头部插入该节点
```

插入头部表示：在当前这个频率下，它是最近使用的节点。

---

## 十、LFU 的频率桶

代码中定义了一个内部双向链表类：

```java
class DoublyLinkedList {
    Node dummyHead = new Node(0, 0, -1);
    Node dummyTail = new Node(0, 0, -1);
    int size = 0;

    DoublyLinkedList() {
        dummyHead.next = dummyTail;
        dummyTail.prev = dummyHead;
    }

    public void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        size--;
    }

    public void insertInToFront(Node node) {
        node.next = dummyHead.next;
        node.next.prev = node;
        dummyHead.next = node;
        node.prev = dummyHead;
        size++;
    }

    public boolean isEmpty() { 
        return size == 0; 
    }
}
```

每个频率对应一条双向链表。

可以把整个 LFU 结构理解为：

```text
freq = 1: head <-> nodeA <-> nodeB <-> tail
freq = 2: head <-> nodeC <-> nodeD <-> tail
freq = 3: head <-> nodeE <-> tail
```

每条链表内部，越靠近头部，表示越近被访问。

越靠近尾部，表示在当前频率下越久没有被访问。

淘汰时，先找到最小频率 `minFreq`，再删除该频率链表尾部的节点：

```java
DoublyLinkedList minFreqList = hash2.get(minFreq);
Node toDeleteNode = minFreqList.dummyTail.prev;
minFreqList.remove(toDeleteNode);
hash1.remove(toDeleteNode.key);
```

这正好实现了：

```text
先 LFU，再 LRU
```

---

## 十一、minFreq 的作用

LFU 中还有一个关键变量：

```java
int minFreq;
```

它记录当前缓存中最小的访问频率。

如果没有 `minFreq`，每次淘汰时就需要遍历所有频率桶，找到最小频率。这样复杂度就不是 `O(1)` 了。

有了 `minFreq`，淘汰时可以直接定位最低频率桶：

```java
DoublyLinkedList minFreqList = hash2.get(minFreq);
```

当一个节点被访问后，它的频率增加。此时需要考虑：如果它原来所在的频率桶空了，并且这个频率刚好是 `minFreq`，那么 `minFreq` 就应该增加。

代码如下：

```java
if (curFreq == minFreq && curList.isEmpty())
    minFreq++;
```

新插入节点的频率一定是 1，所以插入新节点后：

```java
minFreq = 1;
```

这个变量是 LFU 能够做到 `O(1)` 淘汰的关键。

---

## 十二、LFU 的 get 与 put

`get` 操作比较直接。

如果 key 不存在，返回 -1：

```java
if (!hash1.containsKey(key)) return -1;
```

如果 key 存在，更新频率：

```java
Node node = hash1.get(key);
updateNode(node);
return node.val;
```

`updateNode` 是 LFU 的核心逻辑：

```java
private void updateNode(Node node) {
    int curFreq = node.freq++;
    DoublyLinkedList curList = hash2.get(curFreq);
    curList.remove(node);

    if (curFreq == minFreq && curList.isEmpty())
        minFreq++;

    hash2.computeIfAbsent(node.freq, k -> new DoublyLinkedList())
         .insertInToFront(node);
}
```

这个函数做了三件事：

```text
1. 从旧频率桶中删除节点
2. 更新 minFreq
3. 把节点插入新频率桶头部
```

`put` 操作分三种情况。

第一，容量为 0，直接返回：

```java
if (capacity == 0) return;
```

第二，key 已经存在，更新值并增加频率：

```java
if (hash1.containsKey(key)) {
    Node node = hash1.get(key);
    node.val = value;
    updateNode(node);
}
```

第三，key 不存在。如果缓存已满，则执行置换：

```java
if (hash1.size() >= capacity) {
    DoublyLinkedList minFreqList = hash2.get(minFreq);
    Node toDeleteNode = minFreqList.dummyTail.prev;
    minFreqList.remove(toDeleteNode);
    hash1.remove(toDeleteNode.key);
}
```

然后插入新节点：

```java
Node node = new Node(key, value, 1);
hash1.put(key, node);
hash2.computeIfAbsent(1, k -> new DoublyLinkedList()).insertInToFront(node);
minFreq = 1;
```

最终，LFU 的 `get` 和 `put` 也能做到平均 `O(1)`。

---

## 十三、LRU 与 LFU 的对比

LRU 和 LFU 都是在尝试回答同一个问题：

```text
缓存满了，应该淘汰谁？
```

但二者使用的历史信息不同。

LRU 使用近期性：

```text
最近没有被访问的，优先淘汰。
```

LFU 使用频率：

```text
访问次数最少的，优先淘汰。
```

LRU 的优点是实现相对简单，对访问模式变化比较敏感。新的热点数据只要被频繁访问，就会不断移动到链表头部，不容易被淘汰。

LRU 的缺点是容易受到一次性扫描污染。

例如顺序扫描大量冷数据时，真正的热点数据可能会被挤出缓存。

LFU 的优点是能保留长期热点数据。访问频率高的数据即使一段时间没被访问，也不容易被淘汰。

LFU 的缺点是对历史频率过于敏感。一个数据过去很热，但现在已经不再使用，它仍然可能因为频率很高而长期占据缓存。

所以，LRU 偏向“最近趋势”，LFU 偏向“长期统计”。

在实际系统中，缓存策略通常不会采用教科书式的纯 LRU 或纯 LFU，而是做各种近似、衰减和混合。例如操作系统中的 Clock 算法，就是对 LRU 思想的低成本近似。

---

*本文代码对应 LeetCode 146. LRU 缓存和 460. LFU 缓存。参考书目：《操作系统导论》（Operating Systems: Three Easy Pieces）第 22 章“超越物理内存：策略”。*

附录:
LRU 算法代码, 链接: [146. LRU 缓存 - 力扣（LeetCode）](https://leetcode.cn/problems/lru-cache/)
```java
class LRUCache {
    // 虚拟内存的知识
    // 超越物理内存-页交换策略算法的一种-关键在于如何选择已存在的页进行交换-交换后，缓存命中的概率最大
    // 最优的算法：替换"最远将来被访问的页面"    
    // LRU:Least-Recently Used  最近最少使用  也是页交换策略的一种  利用了局部性原理
    // 计算机界的二八原则
    // 关键在于使用什么样的数据结构去实现LRU:考虑页的两种历史经验
    // 1.频率:越是经常被访问的,越是下次最可能被访问
    // 2.近期性: 越是最近被访问的,越是下次最可能被访问
    // 对于LRU,本质是利用了"近期性"这个历史经验, LFU(Least-Frequency-Used)则是利用了"频率"这个页面的历史经验
    // 本质上来说,也是一种缓存管理的策略; 缓存是什么意思呢:内存中的页是整个虚拟页的子集(有部分存储在磁盘之中)
    // 实际上,在os中并不会使用这种数据结构(因为还要额外维护一个双向链表)
    // os中会使用"闹钟算法",在PFE中维护一个"使用位"use bit

    // hash: 根据key快速找到value
    // 双向链表: 快速找到"LRU"的页

    // 使用双向链表表示一个缓存(页)
    class ListNode {
        int key, val;
        ListNode prev;
        ListNode next;

        ListNode(int key, int val) {
            this.key = key; // VPN:Virtual Page Number
            this.val = val;// PPN: Physical Page Number
        }
    }

    // 使用哈希表管理所有的页
    Map<Integer, ListNode> hash;
    ListNode dummyHead;
    ListNode dummyTail;
    int capacity;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        hash = new HashMap<>();

        dummyHead = new ListNode(0, 0);
        dummyTail = new ListNode(0, 0);

        dummyHead.next = dummyTail;
        dummyTail.prev = dummyHead;
    }
    
    public int get(int key) {
        // 缓存未命中
        if(!hash.containsKey(key)) return -1; // swap page --> 重新put

        // 缓存命中
        ListNode node = hash.get(key);
        // 标记为"最常访问的"
        remove(node);
        insertInToFront(node); // 标记为最常访问
        return node.val;
    }
    
    // 加入新的缓存
    public void put(int key, int value) {
        // 已经存在
        if(hash.containsKey(key))
            remove(hash.get(key));

        // 缓存不存在,但是内存不足,需要执行页交换策略,删除最近最少使用
        if(hash.size() == capacity)
            remove(dummyTail.prev);
        insertInToFront(new ListNode(key, value));
    }

    private void remove(ListNode node) {
        hash.remove(node.key);

        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertInToFront(ListNode node) {
        hash.put(node.key, node);

        node.next = dummyHead.next;
        dummyHead.next.prev = node;

        dummyHead.next = node;
        node.prev = dummyHead;
    }
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache obj = new LRUCache(capacity);
 * int param_1 = obj.get(key);
 * obj.put(key,value);
 */
```

LFU 代码,链接: [460. LFU 缓存 - 力扣（LeetCode）](https://leetcode.cn/problems/lfu-cache/)
```java
import java.util.*;

class LFUCache {
    // LFU: Frequency 局部性
    // 关键在于:当两个VPN的freq相同时,就退化为LRU

    // 表示每个映射
    class Node {
        int key, val, freq;
        Node prev, next;

        Node(int key, int val, int freq) {
            this.key = key;
            this.val = val;
            this.freq = freq;
        }
    }

    class DoublyLinkedList {
        Node dummyHead = new Node(0, 0, -1);
        Node dummyTail = new Node(0, 0, -1);
        int size = 0;

        DoublyLinkedList() {
            dummyHead.next = dummyTail;
            dummyTail.prev = dummyHead;
        }

        public void remove(Node node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
            size--;
        }

        public void insertInToFront(Node node) {
            node.next = dummyHead.next;
            node.next.prev = node;
            dummyHead.next = node;
            node.prev = dummyHead;
            size++;
        }

        public boolean isEmpty() { return size == 0; }
    }

    Map<Integer, Node> hash1; // VPN-PPN
    Map<Integer, DoublyLinkedList> hash2; // 频率桶
    int capacity, minFreq;

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.hash1 = new HashMap<>();
        this.hash2 = new HashMap<>();
        this.minFreq = 0;
    }

    public int get(int key) {
        // VPN不存在
        if (!hash1.containsKey(key)) return -1;

        // VPN存在,缓存命中 被访问的频率++
        Node node = hash1.get(key);
        updateNode(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (capacity == 0) return;

        // 如果VPN已存在,更新node的频率
        if (hash1.containsKey(key)) {
            Node node = hash1.get(key);
            node.val = value; // 显式更新值
            updateNode(node);
        } else {
            // VPN不存在-->缓存未命中
            if (hash1.size() >= capacity) {
                // 置换策略
                DoublyLinkedList minFreqList = hash2.get(minFreq);
                Node toDeleteNode = minFreqList.dummyTail.prev;
                minFreqList.remove(toDeleteNode);
                hash1.remove(toDeleteNode.key);
            }

            // 无需置换或已完成置换，插入新节点
            Node node = new Node(key, value, 1);
            hash1.put(key, node);
            hash2.computeIfAbsent(1, k -> new DoublyLinkedList()).insertInToFront(node);
            minFreq = 1;
        }
    }

    // 提取出的公用逻辑：移动到新频率的双向链表中,然后标记为"最近使用"
    private void updateNode(Node node) {
        // 1.删除原频率链表对应的元素
        int curFreq = node.freq++;
        DoublyLinkedList curList = hash2.get(curFreq);
        curList.remove(node);

        // 如果当前频率是最小频率，且移除后该频率桶空了，则提升最小频率
        if (curFreq == minFreq && curList.isEmpty())
            minFreq++;

        // 将当前节点加到新频率的双向链表中,并将此节点放到此双向链表的头部
        hash2.computeIfAbsent(node.freq, k -> new DoublyLinkedList()).insertInToFront(node);
    }
}
```

---
theme: aurora-glass
themeName: "极光玻璃"
title: "从《操作系统导论》到 LeetCode：手写 LRU 与 LFU 缓存"
date: 2026-04-27
---

今天翻到《操作系统导论》（Operating Systems: Three Easy Pieces）里讲页面置换的那一章，忽然觉得书上的理论与 LeetCode 上的题目产生了奇妙的联结。虚拟内存管理中的“该换出哪一页”，和工程中随处可见的缓存淘汰策略，本质上在问同一个问题：**如何用有限的空间，接住未来无限且不可预知的访问序列？** 有没有想到 CPU 调度算法的 MLFQ?

## 一点背景：页交换与局部性

操作系统在虚拟内存中为每个进程维护一个**页表**。虚拟地址空间的页称为 **VPN（Virtual Page Number）**，物理内存中的页帧则称为 **PPN（Physical Page Number）**。物理内存是所有进程的公共资源，当物理内存吃紧时，操作系统必须挑选一些物理页帧写回磁盘，把腾出来的帧分给急需的进程。这个动作叫做**页交换**，挑选牺牲帧的策略就是**页面置换算法**。

为什么置换策略能工作？答案藏在**局部性原理**里。书中用两句话概括：

- **时间局部性**：最近被访问的页面，很可能在不久的将来再次被访问。
- **空间局部性**：被访问页面附近的页面，很可能马上也会被访问。

页面置换算法，就是基于这些历史经验，猜测未来的访问模式。最理想的算法叫 **最优替换（Optimal）**，它换出的是“最远将来才会被访问”的页，可这得预知未来，现实中做不到(太理想化了)。于是退而求其次，有了 **LRU（Least Recently Used，最近最少使用）** 和 **LFU（Least Frequently Used，最不经常使用）** 这类基于历史统计的策略。

有一点值得提前说明：真实的操作系统极少真的实现一个精确的 LRU 链表。原因是硬件支持有限，一般只提供一个“使用位”（use bit，或称引用位），然后配合**时钟算法**做近似。但这不妨碍我们在用户态、在缓存组件中，用精确的数据结构去实现 LRU 和 LFU，而它们所依赖的哲学，和操作系统的思考一脉相承。

## LRU 缓存：用时间局部性决定去留

LRU 认为，越是最近被访问过的页面，越可能再次被访问。那么，当需要腾空间时，就应该淘汰“最近最少使用”的那一个——也就是从后往前数，最久没被碰过的页。

要实现精确 LRU，核心是需要两个能力：

1. 根据 key 快速找到对应的 value（页面映射）。
2. 高效地移动某个条目到“最近被访问”的位置，同时能快速知道谁是最久没被用的。

标准答案呼之欲出：**哈希表 + 双向链表**。哈希表负责 O(1) 查找，双向链表负责维护访问次序。每次访问一个条目，就把它从链表中摘下来，再插到头部；这样链表的尾部自然就是最久没被使用的节点。如果容量满了，直接删除尾节点即可。

下面是我基于这个思路写的 LRU Cache 实现。为了和书中概念对应，我把 `ListNode` 的 `key` 看作 VPN，`val` 看作 PPN。

```java
class LRUCache {
    // 双向链表节点，代表一个缓存页
    class ListNode {
        int key, val; // key: VPN, val: PPN
        ListNode prev, next;

        ListNode(int key, int val) {
            this.key = key;
            this.val = val;
        }
    }

    Map<Integer, ListNode> hash;  // VPN → 节点映射
    ListNode dummyHead, dummyTail;
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
        // 缓存未命中 —— 对应页不在物理内存中，需要缺页处理
        if (!hash.containsKey(key)) return -1;

        // 缓存命中：把该节点标记为最近使用
        ListNode node = hash.get(key);
        remove(node);
        insertInToFront(node);
        return node.val;
    }

    public void put(int key, int value) {
        // 如果页面已经存在，先移除旧版本，后续会重新插入到头部
        if (hash.containsKey(key)) {
            remove(hash.get(key));
        }
        // 内存已满，触发页交换：删除最近最少使用的页面（链表尾部）
        else if (hash.size() == capacity) {
            remove(dummyTail.prev);
        }
        // 将新页面插入头部，标记为最近使用
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
        node.next.prev = node;
        dummyHead.next = node;
        node.prev = dummyHead;
    }
}
```

`remove` 和 `insertInToFront` 很显然。使用 dummy 头尾节点，是为了消灭边界判断，让链表操作永远发生在中间。`get` 命中的时候，节点被移到头部，意味着“我刚用过我最新”；`put` 时如果空间不足，尾部就是那个被遗忘太久的老页面，换出即可。整个过程模拟了一次次页面置换，只不过我们把磁盘 IO 简化成了内存映射的删除。

这里也能看出，OS 不用这种结构是有原因的：每次访问都要更新链表指针，用户态尚且能接受，但放在内核的快速路径（每一次内存访问都会触发）就太奢侈了。所以操作系统才选择了时钟算法——一个 use bit 加一个循环指针，近似达成“给最近没被用的页面一次机会”。

## LFU 缓存：用频率统计决定去留

LRU 只关心“最近”，LFU 则信奉“过去的总访问次数”。如果一个页面历史上被访问的次数最少，说明它最不受欢迎，应该被优先淘汰。

LFU 实现更复杂一些，因为现在要考虑两个维度：

- 访问频率，决定淘汰优先级。
- 在频率相同的情况下，该淘汰谁？答案是：退化成 LRU，淘汰同频率中最久没被访问的那个。

数据结构我用了两个哈希表：

- `hash1`：key 到 Node 的映射（和 LRU 基本一样）。
- `hash2`：频率 `freq` 到一个双向链表的映射。同一个频率的所有节点被维护在该频率对应的双向链表中，链表头部是最近被访问的（同一频率内保持 LRU 顺序）。

同时用一个变量 `minFreq` 记录当前所有缓存中的最小频率。当需要淘汰时，直接去 `minFreq` 对应的链表尾部摘节点。因为只要 `minFreq` 对应的链表为空，我们就递增 `minFreq`，所以它始终指向非空的最小频率。

下面是我的 LFU Cache 代码，依然把节点看作页，`key` 为 VPN，`val` 为 PPN，额外多一个 `freq` 字段记录访问次数。

```java
class LFUCache {
    class Node {
        int key, val, freq;
        Node prev, next;

        Node(int key, int val, int freq) {
            this.key = key;
            this.val = val;
            this.freq = freq;
        }
    }

    // 频率桶：一个频率对应一个双向链表，链表内按 LRU 顺序排列
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

    Map<Integer, Node> hash1;               // VPN → Node
    Map<Integer, DoublyLinkedList> hash2;   // freq → 桶
    int capacity, minFreq;

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.hash1 = new HashMap<>();
        this.hash2 = new HashMap<>();
        this.minFreq = 0;
    }

    public int get(int key) {
        if (!hash1.containsKey(key)) return -1;

        // 缓存命中，频率加一，挪到对应频率桶的头部
        Node node = hash1.get(key);
        updateNode(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (capacity == 0) return;

        if (hash1.containsKey(key)) {
            // 页面已存在：更新值，频率增加
            Node node = hash1.get(key);
            node.val = value;
            updateNode(node);
        } else {
            // 缓存未命中，且物理内存已满：触发页交换
            if (hash1.size() >= capacity) {
                DoublyLinkedList minFreqList = hash2.get(minFreq);
                Node toDelete = minFreqList.dummyTail.prev; // 同频率中最旧的
                minFreqList.remove(toDelete);
                hash1.remove(toDelete.key);
            }
            // 插入新页面，频率为 1
            Node node = new Node(key, value, 1);
            hash1.put(key, node);
            hash2.computeIfAbsent(1, k -> new DoublyLinkedList())
                 .insertInToFront(node);
            minFreq = 1;
        }
    }

    // 页面访问频率变化后的通用处理：从旧频率桶取出，放进新频率桶头部
    private void updateNode(Node node) {
        int curFreq = node.freq++;
        DoublyLinkedList curList = hash2.get(curFreq);
        curList.remove(node);

        // 如果删除后旧频率桶为空，并且该频率刚好是当前最小频率，则提升最小频率
        if (curFreq == minFreq && curList.isEmpty()) {
            minFreq++;
        }

        hash2.computeIfAbsent(node.freq, k -> new DoublyLinkedList())
             .insertInToFront(node);
    }
}
```

几个关键点：

- 所有对节点的访问（`get` 命中、`put` 更新）最终都会调用 `updateNode`，它的职责是把节点从当前频率桶剥离，频率加一后插入新频率桶的头部。这一步同时保持了频率的正确性和“同频最近使用”的头部位置。
- 当需要淘汰时，直接看 `minFreq` 对应的桶。因为 `minFreq` 永远指向有实体的最小频率，且桶内使用 LRU，尾部就是最短最不活跃的页面。这里完美体现了题目要求：“频率相同则淘汰最久未使用”。
- `hash2.computeIfAbsent` 保证了频率桶的惰性创建，避免预开辟无意义的空桶。

## 对比与思考

LRU 和 LFU 分别捕捉了两种历史经验：**近期性**与**频率**。LRU 对访问模式的突变反应迅速，能很快忘记旧的热点；LFU 则更重视长期积累，适合热点相对稳定的场景。两者在 LeetCode 上都是经典的“数据结构设计”题，但在真实的操作系统里，它们很少被原封不动地实现。

《操作系统导论》提到，真实的 OS 一般使用**时钟算法**（或增强的第二次机会算法）。硬件为每个物理页帧提供一个**使用位**，当页面被访问时，硬件自动置 1。时钟算法维护一个环形链表，指针扫描时检查使用位：若为 1，则清 0 并给第二次机会；若为 0，则换出。这种方式不需要额外维护双向链表，每次访问也无需显式移动节点，仅依靠硬件置位和定期扫描就能达到近似 LRU 的效果。

从工程角度看，类似的设计问题在 Redis、数据库缓冲池、CPU 缓存、CDN 边缘节点中一再出现。LRU 及其近似变体因其简单高效成为事实标准，而 LFU 在一些对历史模式敏感的系统中也会现身（例如某些数据库的查询计划缓存）。把基本原理吃透，再去看这些具体实现，就会有“原来如此”的畅快感。

---

*本文代码对应 LeetCode 146. LRU 缓存和 460. LFU 缓存。参考书目：《操作系统导论》（Operating Systems: Three Easy Pieces）第 22 章“超越物理内存：策略”。*
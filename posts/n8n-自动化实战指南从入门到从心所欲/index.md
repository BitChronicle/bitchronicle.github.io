# N8n 自动化实战指南：从入门到从心所欲


# n8n 自动化实战指南：从入门到从心所欲

## 1. 前言：像程序员一样思考 n8n

恭喜你已经安装好了 n8n。在使用它之前，你需要转变一个思维模式：

> **在 n8n 中，一切皆为 JSON 对象数组。**

与其他自动化工具（如 IFTTT/Zapier）处理单条数据不同，n8n 默认是**批处理**的。当上一个节点输出了 10 条数据，下一个节点通常会自动运行 10 次（除非是聚合类节点）。理解这一点，是你通过 n8n 掌控复杂逻辑的关键。

---

## 2. 核心三剑客：Node, Connection, Workflow



* **Workflow (工作流)**：你的整个自动化脚本。
* **Nodes (节点)**：
    * **Trigger (触发器)**：流程的起点（例如：定时任务 `Schedule`，Webhook `Webhook`，手动点击 `Manual`）。
    * **Function (逻辑)**：处理数据的核心（例如：`HTTP Request`，`Edit Fields`，`Code`）。
* **Connection (连线)**：数据流动的管道。数据从左流向右。

---

## 3. 实战演练：构建一个“加密货币价格监控器”

我们将构建一个工作流：**每分钟查询一次比特币价格，如果价格低于某个阈值，打印一条日志（或发送通知）。**

### 步骤 1：设置触发器 (Trigger)

1.  在画布点击 `+`。
2.  搜索并选择 **Schedule**。
3.  设置 `Trigger Interval` 为 `Minutes`，`Value` 为 `1`。
    * *作用：这相当于 Linux 的 Cron Job，每分钟唤醒一次流程。*

### 步骤 2：获取数据 (HTTP Request)

这是 n8n 最强大的地方，可以替代 Python 的 `requests` 库。



1.  添加 **HTTP Request** 节点。
2.  配置如下：
    * **Method**: `GET`
    * **URL**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
    * **Authentication**: None (这是一个公开 API)。
3.  点击 **Test Step**。
    * 观察 Output，你会看到类似这样的 JSON：
        ```json
        [
          {
            "bitcoin": {
              "usd": 95000
            }
          }
        ]
        ```

### 步骤 3：数据清洗 (Edit Fields / Set)

原始数据嵌套太深（`bitcoin.usd`），我们需要把它“提”出来，方便后面使用。



1.  添加 **Edit Fields** (旧版本叫 Set) 节点。
2.  在 Parameters 面板：
    * **Mode**: `Assign Selected Fields` (或默认模式)。
    * 点击 `Add Field`。
    * **Name**: `btc_price`
    * **Value**: *这里使用表达式*。
        * 将鼠标悬停在 Value 输入框，点击右侧出现的 `Expression` 标签。
        * 在左侧的 Input Data 树中，找到 `usd`，直接**拖拽**到 Value 框中。
        * 你会看到代码变成了：`{{ $json.bitcoin.usd }}`。
3.  点击 **Test Step**。现在的输出变得很干净：
    ```json
    [
      {
        "btc_price": 95000
      }
    ]
    ```

### 步骤 4：逻辑判断 (If)

1.  添加 **If** 节点。
2.  配置 Conditions：
    * **Type**: `Number`
    * **Value 1**: 拖拽上一步生成的 `btc_price` 字段（或者输入 `{{ $json.btc_price }}`）。
    * **Operation**: `Less than` (<)。
    * **Value 2**: `100000` (假设我们要监控它是否跌破 10万)。
3.  点击 **Test Step**。
    * 如果当前价格 < 100000，数据会流向 **True** 分支。
    * 否则流向 **False** 分支。

---

## 4. 进阶技巧：处理复杂的 API 列表数据

这是大多数新手（包括开发者）最容易卡壳的地方。

**场景**：你请求了一个 API，它返回了一个包含 50 个对象的数组（例如股票列表）。
**目标**：你只想保留其中 `PE` (市盈率) < 20 的股票。

### 错误做法
试图在 `If` 节点里写 For 循环。

### 正确做法 (n8n Way)
n8n 会自动帮你循环。

1.  **HTTP Request** 返回数据结构：
    ```json
    [
      { "name": "Stock A", "pe": 15 },
      { "name": "Stock B", "pe": 25 },
      { "name": "Stock C", "pe": 10 }
    ]
    ```
    *(注意：n8n 会把这个 JSON 数组拆开，视为 3 个独立的 Items)*

2.  连接一个 **If** 节点：
    * 条件：`pe` < `20`。
3.  **结果**：
    * n8n 会运行 3 次 If 判断。
    * Stock A 和 Stock C 会从 **True** 连线流出。
    * Stock B 会从 **False** 连线流出。
4.  **后续**：
    * 如果你连接一个 "发送邮件" 节点在 True 后面，你将收到 **2 封邮件**。

### 如果你想把它们合并成一封邮件？
使用 **Aggregate** (聚合) 节点，或者 **Code** 节点。

---

## 5. 开发者专用：Code 节点 (JavaScript)

当标准节点无法满足你的复杂逻辑（比如复杂的正则提取、加密签名生成）时，使用 Code 节点。

**模式选择**：
* `Run Once for All Items`: 输入是整个数组，适合聚合、排序、过滤。
* `Run for Each Item`: 输入是单条数据，适合对每一行做同样的转换。

**示例代码：过滤并格式化**

```javascript
// 假设这是 "Run Once for All Items" 模式
const items = $input.all();
const results = [];

for (const item of items) {
  const price = item.json.btc_price;
  
  // 自定义复杂逻辑
  if (price > 50000 && price < 150000) {
    results.push({
      json: {
        message: `当前价格正常: ${price}`,
        timestamp: new Date().toISOString()
      }
    });
  }
}

return results;
```
---
## 6. 调试与排错 (Debugging)



1.  **Pin Data (固定数据)**：
    * 在开发 HTTP Request 后面节点时，不要每次都真的去请求 API（浪费次数且慢）。
    * 点击 HTTP Request 节点右上角的 **大头针图标** (Pin Data)。
    * 这样后续的节点测试时，会直接使用上次缓存的数据。

2.  **Executions (执行日志)**：
    * 左侧边栏的 `Executions` 是你的黑匣子。
    * 双击任意一条失败的记录，你可以看到数据流到哪个节点断掉了，以及具体的 Error Message。

---

## 7. 常用节点速查表

| 节点名称 | 用途 | 备注 |
| :--- | :--- | :--- |
| **Schedule** | 定时触发 | 类似 Crontab，用于定时任务 |
| **Webhook** | 被动触发 | 用于接收外部推送（如 GitHub Push，支付回调） |
| **HTTP Request** | 请求 API | 支持 GET, POST, Auth, Headers 等 |
| **Edit Fields (Set)**| 变量赋值 | 最常用的节点，用于提取字段、重命名、赋值 |
| **If** | 条件判断 | 自动循环处理数组，无需写 For 循环 |
| **Switch** | 多重判断 | 类似于编程中的 switch-case，多分支路由 |
| **Merge** | 数据合并 | 将两个分支的数据合二为一 (Append/Merge By Key) |
| **Code** | 运行 JS | 万能节点，支持标准 JS 和 npm 模块（需配置） |

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/n8n-%E8%87%AA%E5%8A%A8%E5%8C%96%E5%AE%9E%E6%88%98%E6%8C%87%E5%8D%97%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E4%BB%8E%E5%BF%83%E6%89%80%E6%AC%B2/  


# 基于FrontMatter的Hugo进阶使用——数据库方向

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hugo对Front Matter（头部元数据）的处理是隐性的，这给了使用者很大的自由度。本质上就是我们利用Front Matter控制Hugo的编译输出，把Front Matter内容当成一种解释性的脚本语言，正文当成项目说明书或者是编译后的输入以及注释就能更好的理解本文了。

## 🧠 核心思想
###  **一篇 Markdown = 一条结构化数据记录**

永远记住：
>写出来的Markdown格式文章不仅仅是“文章”。

而是：

>头部元数据 + 内容

🧱 关键武器：**Front Matter**（头部元数据）

### Front Matter的特殊处理

Hugo 里其实已经在用了，只是没有展开使用。

这里我举个例子，一个标准的Front Matter大概如下：


```yaml
---
title: 可转债暴力筛选模型
date: 2026-02-03
tags: [量化, 可转债]
---
正文...
```

我们可以换个思路，**Front Matter这块里面是字段数据**。

这等价于数据库里一行：
```mql
字段	              值
title	        可转债暴力筛选模型
date            2026-02-03
tags            量化&可转债
```
Hugo会把它当数据库用，所以我们可以扩展一下Front Matter:

```yaml
---
title: 可转债暴力筛选模型
date: 2026-02-03
tags: [量化, 可转债]
risk_level: 高
strategy_type: 事件驱动
status: 在用
---
正文...
```
对应的数据库数据就是:

```text
字段	              值
title	        可转债暴力筛选模型
date            2026-02-03
tags            量化&可转债
risk_level	    高
strategy_type	事件驱动
status	        在用
```
### Hugo怎么处理Front Matter字段
直接在模板里筛选：

#### 🔎 只显示“高风险策略”
```go
{{ range where .Site.RegularPages "Params.risk_level" "高" }}
  {{ .Title }}
{{ end }}
```
#### 📂 按策略类型自动分类
```go
{{ range where .Site.RegularPages "Params.strategy_type" "事件驱动" }}
```
这种思路很接近*内容管理系统（CMS）*。

主要思想就是

 >把**Markdown文件**当成 **JSON 文档** + **文本描述**来处理。
```text
🚀 这套模式牛在哪？
 博客	       这种玩法
写文章	     录入数据对象
手动整理	     自动生成页面
分类靠人	     分类依靠字段
查找靠翻	     查找依靠查询
```




## 🔥 进阶思考：“Markdown内容数据库”
比如可以搞：

- 📚  技术知识库
  ```yaml
  ---
  title: Rust 所有权
  type: language_concept
  language: Rust
  difficulty: 4
  related: [生命周期, 借用]
  ---
  ```
- 💰 投资记录
  ```yaml
  ---
  bond: 盟升转债
  buy_price: 190
  strategy: 事件驱动
  confidence: 3
  ---
  ```
然后 Hugo 自动生成：

- 📈 策略列表页

- 🧠 技术知识图谱页

- 🔍 按难度筛选页

写的是 Markdown，得到的是**数据库**驱动网站。

### 自定义字段
这正是 Markdown + Hugo 最爽的地方 ——
字段你随便发明，Hugo 不管你写什么名字。

它不像数据库要先建表，我们可以：

✍ 先写字段 → 🧠 再决定怎么用

🧱 字段想怎么起名都行，比如说：
### 模板读取举例

```yaml
---
title: 华钰转债事件策略
buy_price: 187
sell_condition: 放量涨停失败
risk_level: 4
emotion_state: 冷静
confidence_score: 7
is_core_strategy: true
tags: [可转债, 事件驱动]
---
```
这些字段：

```emotion_state```

```confidence_score```

```sell_condition```

Hugo 完全不认识，但——我可以在模板里调用它们。

模板里直接读取
```go
买入价：{{ .Params.buy_price }}
信心指数：{{ .Params.confidence_score }}
```
筛选：
```go
{{ range where .Site.RegularPages "Params.is_core_strategy" true }}
```
## 📊 甚至可以当“量化数据库”用
### 比如搞投资记录：

```yaml
---
bond: 盟升转债
buy_price: 190
position_size: 0.3
reason: 博弈回售
risk: 高
winrate_estimate: 0.62
---
```
然后生成：
```text
转债	仓位	风险	预期胜率
```
自动从 Markdown 读取。

这是一个“数据对象”,
所谓的文章正文只是这个对象的“描述字段”，方便自己记录并在以后回忆当时的决策过程。

#### ❗ 注意两个小规则:
- 1️⃣ 字段名不要有空格

  ❌ buy price

  ✅ buy_price

- 2️⃣ 布尔值不要加引号
  ```yaml
  is_core: true   ✅
  is_core: "true" ❌（会变字符串）
  ```
#### 🎯 本质
这其实是用文件系统当 NoSQL 数据库

而 Markdown 文件 = 文档型数据库的一条记录（类似 MongoDB）

## 我思考了三个模板，供以后使用。

分别是：
- 投资策略模板

- 技术知识模板

- 工具记录模板

以后所有 md 统一格式，直接变数据库。😁
### 💰 一、投资策略模板
```yaml
---
title: 策略名称
type: strategy

# === 标的相关 ===
symbol: 盟升转债
market: A股
category: 可转债

# === 策略属性 ===
strategy_type: 事件驱动      # 套利 / 趋势 / 情绪 / 价值
timeframe: 短线             # 日内 / 短线 / 波段 / 长线
risk_level: 4               # 1-5
capital_usage: 0.3          # 仓位比例
repeatable: true            # 是否可复用

# === 决策逻辑 ===
core_logic: 回售博弈
edge_source: 信息差         # 信息差 / 结构性 / 行为偏差 / 制度规则
invalid_condition: 回售预期落空

# === 执行计划 ===
entry_rule: 放量突破平台
exit_rule: 预期兑现或情绪退潮
stop_rule: 跌破关键支撑

# === 评估 ===
confidence_score: 7         # 1-10
expected_winrate: 0.62
expected_rr: 2.5            # 盈亏比

# === 结果复盘（后填）===
result: 未结束              # 盈利 / 亏损 / 进行中
mistake_type: 无
lesson: 等待回售公告确认

visibility: private
date: 2026-02-03
tags: [可转债, 事件驱动]
---
### 正文，用于过程记录和写一些备忘。
```
🧠 这套字段可以在以后：

筛选“高胜率策略”

查看“可重复模式”

分析自己常犯错误

### 🧠 二、技术知识模板
```yaml
---
title: Rust 所有权机制
type: knowledge

domain: 编程语言
language: Rust
category: 内存模型

difficulty: 4           # 1-5
importance: 5           # 长期价值
mastery: 2              # 自己掌握程度 1-5

related: [借用, 生命周期]

source_type: 官方文档   # 书籍 / 实践 / 文章 / 视频
verified: true          # 是否实战验证过

use_case: 避免悬垂指针
common_mistake: 误解可变借用规则

visibility: private
date: 2026-02-03
tags: [Rust, 底层原理]
---
### 核心理解
……

### 正文，包括示例代码，以及其他说明。
```
📚 以后可以自动生成：

按难度排序学习路径

自己掌握度统计

技术图谱页面

### 🛠 三、工具记录模板
```yaml
---
title: Pandoc
type: tool

category: 文档处理
platform: 跨平台

use_frequency: 4       # 使用频率 1-5
power_level: 5         # 能力强度
learning_cost: 3

best_for: 格式转换自动化
alternatives: [Typora, Word]

automation_possible: true
scriptable: true

pain_point_solved: Markdown 批量转 PDF
limitation: 模板配置复杂

status: 在用           # 在用 / 观察 / 淘汰

visibility: public
date: 2026-02-03
tags: [效率, 自动化]
---
### 正文，包括使用方式、心得等内容。
```

⚙ 这能帮助我以后：

找到“最高性价比工具”

分析自己工具栈变化

自动生成“我的工具箱”页面


```text
🧩 你现在拥有的系统结构
类型	        本质
投资策略		决策数据库
技术知识		认知数据库
工具记录		能力扩展数据库
``` 
如此构建个人“认知操作系统”的三大数据表。

如果我们进一步思考，继续升级，下一步就是：

## 使用我们自设的字段

### 📊 认知量化系统：

可以自动统计

- 哪类策略赚钱最多

- 哪类知识最重要

- 哪些工具最常用

### 🧠 核心原理
每篇 md = 一条数据记录
Hugo 可以：

读取所有文件 → 提取字段 → 计算 → 输出结果页
就像 SQL 的：

```sql
SELECT AVG(winrate) FROM strategies WHERE risk_level >= 4;
```
只是我们用的是模板语法。

#### 💰 示例1：统计“策略总数”
新建页面：

```content/dashboard/_index.md```

```yaml
---
title: 策略统计面板
layout: dashboard
---
```
然后建模板：

```layouts/_default/dashboard.html```

```go
<h2>策略总数</h2>
{{ $strategies := where .Site.RegularPages "Type" "strategy" }}
{{ len $strategies }}
```
#### 📊 示例2：统计“平均信心指数”
```go
{{ $total := 0 }}
{{ $count := 0 }}

{{ range where .Site.RegularPages "Type" "strategy" }}
  {{ $total = add $total .Params.confidence_score }}
  {{ $count = add $count 1 }}
{{ end }}

平均信心值：{{ div $total $count }}
```
#### 🧮 示例3：统计“盈利策略数量”
假设字段：

```yaml
result: 盈利
```
统计：
```go
{{ $wins := where .Site.RegularPages "Params.result" "盈利" }}
盈利次数：{{ len $wins }}
```
#### 📈 示例4：按风险等级分类统计
```go
{{ range seq 1 5 }}
  <h3>风险等级 {{ . }}</h3>
  {{ $filtered := where $.Site.RegularPages "Params.risk_level" . }}
  数量：{{ len $filtered }}
{{ end }}
```
### 🧠 如何理解？
```plaintext
Markdown	       相当于
Front Matter	   数据表字段
文件	           一条记录
Hugo 模板	       SQL 查询
页面	           报表
```
### 🚀 高阶玩法
```text
功能	            实现方式
统计收益率曲线  	读字段 + JS 图表
策略胜率排名	    sort + range
常犯错误统计	    统计 mistake_type
工具使用频率排行	统计 use_frequency
```
### 🎯 升级路线
写文章的人

⬇

记录数据的人

⬇

分析自己认知行为的人

### 📊「个人投资策略仪表盘」完整模板

现在我有一个想法，打开网站就看到：

总策略数

胜率

平均信心

风险分布

像交易系统后台一样。

- 🧱 ① 先确保策略 md 都是这种类型

  文件路径示例：

  ```bash
  content/strategy/xxx.md
  ```
  Front Matter 里要有：

  ```yaml
  type: strategy
  risk_level: 4
  confidence_score: 7
  result: 盈利   # 盈利 / 亏损 / 进行中
  ```
- 📄 ② 新建仪表盘页面
  
  ```📁 content/dashboard/_index.md```

  输入：

  ```yaml
  ---
  title: 策略仪表盘
  layout: dashboard
  ---
  ```
- 🎛 ③ 新建模板
  ```📁 layouts/_default/dashboard.html```

  内容：

  ```go 
  <h1>📊 投资策略仪表盘</h1>
  
  {{ $strategies := where .Site.RegularPages "Type" "strategy" }}

  <h2>📌 基本统计</h2>
  总策略数：{{ len $strategies }} <br>

  {{ $wins := where $strategies "Params.result" "盈利" }}
  {{ $losses := where $strategies "Params.result" "亏损" }}

  盈利次数：{{ len $wins }} <br>
  亏损次数：{{ len $losses }} <br>

  {{ if gt (len $strategies) 0 }}
  胜率：{{ mul (div (len $wins) (len $strategies)) 100 }}%  
  {{ end }}

  <hr>

  <h2>🧠 平均信心指数</h2>

  {{ $totalConf := 0 }}
  {{ $count := 0 }}

  {{ range $strategies }}
    {{ with .Params.confidence_score }}
      {{ $totalConf = add $totalConf . }}
      {{ $count = add $count 1 }}
    {{ end }}
  {{ end }}

  {{ if gt $count 0 }}
  平均信心值：{{ div $totalConf $count }}
  {{ end }}

  <hr>

  <h2>⚠ 风险等级分布</h2>

  {{ range seq 1 5 }}
    {{ $filtered := where $strategies "Params.risk_level" . }}
    风险等级 {{ . }} ：{{ len $filtered }} 条<br>
  {{ end }}

  <hr>

  <h2>🏆 信心最高策略 Top 5</h2>

  {{ range first 5 (sort $strategies "Params.confidence_score" "desc") }}
  • {{ .Title }}（信心：{{ .Params.confidence_score }}）<br>
  {{ end }}
  ```
- 🚀 ④ 运行
  ```bash
  hugo server
  ```
  浏览器打开：

  ```bash
  /dashboard/
  ```
  你会看到：

   ```text
  模块	        含义
  总策略数  	数据库规模
  胜率	    你的判断质量
  平均信心	    是否过度自信
  风险分布	    风格偏向
  Top5	    最看好的策略
    ```
此时已经完成了交易系统后台可视化

也是一个认知行为统计系统

### 再进化(复盘-行为分析)

就是加：

📈 曲线图

📅 按时间统计

📊 收益率分布

那就彻底变成“个人量化研究后台”了。

我们用浏览器自带 JS + Hugo 把数据“吐”给图表。

#### 🎯 目标
在仪表盘增加：

- 📈 策略数量随时间变化

- 📊 风险等级柱状图

##### 🧱 第一步：确保策略有日期
每个策略 md文件头：

```yaml
date: 2026-02-01
```
##### 📄 第二步：在 dashboard.html 里加入数据输出
在页面顶部加入：

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
🧠 ① 输出“时间序列数据”
gohtml
<script>
const strategyDates = [
{{ range where .Site.RegularPages "Type" "strategy" }}
  "{{ .Date.Format "2006-01-02" }}",
{{ end }}
];
</script>
⚠ ② 输出风险等级统计数据
gohtml
<script>
const riskCounts = [
{{ range seq 1 5 }}
  {{ len (where $.Site.RegularPages "Params.risk_level" .) }},
{{ end }}
];
</script>
```
##### 📊 第三步：放图表容器
在 HTML 里加：

```html
<h2>📈 策略数量趋势</h2>
<canvas id="timeChart"></canvas>

<h2>⚠ 风险分布</h2>
<canvas id="riskChart"></canvas>
```
##### ⚙ 第四步：画图
```html
<script>
/* ===== 时间趋势图 ===== */
const ctx1 = document.getElementById('timeChart');

const dateCounts = {};
strategyDates.forEach(d => {
  dateCounts[d] = (dateCounts[d] || 0) + 1;
});

const labels = Object.keys(dateCounts).sort();
const values = labels.map(d => dateCounts[d]);

new Chart(ctx1, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: '策略数量',
      data: values,
      fill: false,
      tension: 0.2
    }]
  }
});

/* ===== 风险等级图 ===== */
const ctx2 = document.getElementById('riskChart');

new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: ['1','2','3','4','5'],
    datasets: [{
      label: '风险等级分布',
      data: riskCounts
    }]
  }
});
</script>
```
##### 🚀 效果
页面现在有：
```text
图表	         含义
📈 策略趋势	  最近是否频繁出手
📊 风险分布	  是否过度冒险
```
#### 🧠 升级路线

写策略

⬇

记录策略

⬇

统计策略

⬇

可视化自己的决策行为

这就是复盘，也就是日志所带来的“行为分析”。

### 再进化(复盘-交易认知)

比如：

胜率随时间变化

不同策略类型收益对比

常犯错误热力图


我们加两个真正专业的指标：

📈 胜率随时间变化
🔥 常犯错误统计

##### 🧠 一、胜率时间曲线（判断是否“只是运气好”）
📌 前提字段

每个策略：

```yaml
date: 2026-02-01
result: 盈利   # 盈利 / 亏损
```
① Hugo 输出数据
```html
<script>
const tradeData = [
{{ range where .Site.RegularPages "Type" "strategy" }}
  {
    date: "{{ .Date.Format "2006-01-02" }}",
    win: {{ if eq .Params.result "盈利" }}1{{ else }}0{{ end }}
  },
{{ end }}
];
</script>
② JS 计算“累计胜率”
html
<canvas id="winrateChart"></canvas>

<script>
tradeData.sort((a,b)=> new Date(a.date)-new Date(b.date));

let total = 0, wins = 0;
const labels = [];
const winrate = [];

tradeData.forEach(t => {
  total++;
  wins += t.win;
  labels.push(t.date);
  winrate.push((wins/total*100).toFixed(1));
});

new Chart(document.getElementById('winrateChart'), {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: '累计胜率%',
      data: winrate,
      tension: 0.2
    }]
  }
});
</script>
```
📊 得到图像以后：

- 曲线上升 → 判断力稳定

- 曲线下降 → 情绪或环境变了

这就是“状态监控”。

##### 🔥 二、常犯错误热度图
字段：

```yaml
mistake_type: 追高 / 过早止盈 / 情绪单 / 无
```
① Hugo 输出错误数据
```html
<script>
const mistakes = [
{{ range where .Site.RegularPages "Type" "strategy" }}
  "{{ .Params.mistake_type }}",
{{ end }}
];
</script>
② JS 统计
html
<canvas id="mistakeChart"></canvas>

<script>
const mistakeCount = {};
mistakes.forEach(m => {
  if(m && m !== "无"){
    mistakeCount[m] = (mistakeCount[m] || 0) + 1;
  }
});

new Chart(document.getElementById('mistakeChart'), {
  type: 'bar',
  data: {
    labels: Object.keys(mistakeCount),
    datasets: [{
      label: '错误次数',
      data: Object.values(mistakeCount)
    }]
  }
});
</script>
```
📊 得到输出以后：

**“原来我 40% 的亏损来自同一种错误”**😫

>这比研究K线有用得多。

🧠 此时的Hugo
```text
 模块	   作用
策略统计	  宏观能力
风险分布	  风格倾向
胜率曲线	  状态变化
错误统计	  行为漏洞
```

### 再进化(复盘-策略胜率)



有时候是不是会想 “我不是不会交易，是在某种状态下才会亏钱。”?

也就是

情绪 vs 胜率关系

策略类型盈利能力对比


#### 🧩 一、加两个关键字段（以后每条策略都填）
```yaml
market_env: 情绪高涨    # 情绪高涨 / 震荡 / 恐慌 / 冷清
emotion_state: 冷静     # 冷静 / 急躁 / 自信 / 恐惧
```
#### 📊 二、分析 ①：不同市场环境下的胜率
Hugo 输出数据:

```html
<script>
const envData = [
{{ range where .Site.RegularPages "Type" "strategy" }}
  {
    env: "{{ .Params.market_env }}",
    win: {{ if eq .Params.result "盈利" }}1{{ else }}0{{ end }}
  },
{{ end }}
];
</script>
```
JS 统计
```html
<canvas id="envChart"></canvas>

<script>
const envStats = {};

envData.forEach(t => {
  if(!envStats[t.env]) envStats[t.env] = {w:0,t:0};
  envStats[t.env].t++;
  envStats[t.env].w += t.win;
});

const labels = Object.keys(envStats);
const winrates = labels.map(e => (envStats[e].w/envStats[e].t*100).toFixed(1));

new Chart(document.getElementById('envChart'), {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: '不同市场环境胜率%',
      data: winrates
    }]
  }
});
</script>
```
🧠 结果可能是：
```text
环境	  胜率
情绪高涨	  72%
震荡	  41%
```
→ *你只适合做情绪周期，不适合震荡市场。*

#### ❤️ 三、分析 ②：情绪对胜率的影响
```html
<script>
const emotionData = [
{{ range where .Site.RegularPages "Type" "strategy" }}
  {
    emotion: "{{ .Params.emotion_state }}",
    win: {{ if eq .Params.result "盈利" }}1{{ else }}0{{ end }}
  },
{{ end }}
];
</script>
```
```html
<canvas id="emotionChart"></canvas>

<script>
const emoStats = {};

emotionData.forEach(t => {
  if(!emoStats[t.emotion]) emoStats[t.emotion] = {w:0,t:0};
  emoStats[t.emotion].t++;
  emoStats[t.emotion].w += t.win;
});

new Chart(document.getElementById('emotionChart'), {
  type: 'bar',
  data: {
    labels: Object.keys(emoStats),
    datasets: [{
      label: '不同情绪状态胜率%',
      data: Object.values(emoStats).map(v => (v.w/v.t*100).toFixed(1))
    }]
  }
});
</script>
```
🧠 你可能会发现：
```text
情绪	  胜率
冷静	  68%
急躁	  29%
```
这不是技术问题，这是心理问题。

 >“在某种市场环境 + 某种情绪下，我应该禁止自己交易”

更进一步的挖掘这些md文件，我们可以有更大的使用场景。
### 📊 可转债量化研究数据库（个人版）
既然现在我们有了很多的交易文件，那么就要挖掘自己的交易风格。
成功就在于不断地审视自己，批评自己。

#### 🧱 一、目录结构（这是数据库骨架）
```bash
content/
└── strategy/              ← 所有策略记录
    ├── 2026-01-20-某某转债.md
    ├── 2026-01-25-情绪龙.md
    └── ...
```
这些 md 文件就是交易数据库表。

#### 🧾 二、每一笔交易 = 一条“结构化数据”
```yaml
---
title: "情绪高标套利"
date: 2026-01-25

bond: "盟升转债"
code: "118012"

strategy_type: 情绪龙头
pattern: 高位换手板
market_env: 情绪高涨
emotion_state: 冷静

buy_price: 182
sell_price: 196
position: 0.5
holding_days: 2

result: 盈利      # 盈利 / 亏损 / 保本
profit_pct: 7.69

mistake: 无
review: 量能健康，情绪周期主升段
---

正文随便写复盘细节
```
>一句话，把博客当成结构化交易复盘日志去写。

#### 🧠 三、Hugo 自动读取成“数据数组”
在策略面板页面：

```js
<script>
const trades = [
{{ range where .Site.RegularPages "Type" "strategy" }}
{
  bond: "{{ .Params.bond }}",
  type: "{{ .Params.strategy_type }}",
  env: "{{ .Params.market_env }}",
  emotion: "{{ .Params.emotion_state }}",
  result: "{{ .Params.result }}",
  profit: {{ .Params.profit_pct }},
  days: {{ .Params.holding_days }}
},
{{ end }}
];
</script>
```
➡️ 所有 Markdown 自动变 JS 数据库。

#### 📊 四、策略胜率统计（自动）
```html
<canvas id="winChart"></canvas>
<script>
const stats = {};

trades.forEach(t=>{
  if(!stats[t.type]) stats[t.type]={w:0,t:0};
  stats[t.type].t++;
  if(t.result==="盈利") stats[t.type].w++;
});

new Chart(document.getElementById('winChart'),{
 type:'bar',
 data:{
  labels:Object.keys(stats),
  datasets:[{
    label:'策略胜率%',
    data:Object.values(stats).map(v=>(v.w/v.t*100).toFixed(1))
  }]
 }
});
</script>
```
#### 📈 五、收益曲线（你会爱死这个）
```html
<canvas id="equityChart"></canvas>
<script>
let equity = 1;
const curve = trades.map(t=>{
 equity *= (1 + t.profit/100);
 return equity;
});

new Chart(document.getElementById('equityChart'),{
 type:'line',
 data:{labels:trades.map((_,i)=>i+1), datasets:[{label:'资金曲线',data:curve}]}
});
</script>
```
#### 🧩 六、可查询系统（筛选）
```html
<select id="envFilter">
  <option value="">全部环境</option>
  <option>情绪高涨</option>
  <option>震荡</option>
</select>

<script>
document.getElementById('envFilter').onchange = e=>{
 const v=e.target.value;
 console.log(trades.filter(t=>!v || t.env===v));
}
</script>
```
可以扩展成：

- 按策略类型筛选

- 按情绪筛选

- 只看亏损单

- 只看某只转债

- 这已经是个人交易BI系统。

#### 🏆 七、最终成果
```text
你写的东西	        系统自动变成
Markdown	        数据库
Front Matter字段	数据列
Hugo 模板	        SQL 查询层
JS	                统计引擎
页面	            交易决策面板
```
### 🔥 错误模式识别系统（行为分析引擎）
更进一步，我们可以让系统自动找出：

在哪种市场最容易亏

哪种情绪状态会导致错误

哪种策略 + 环境组合是“死亡组合”


#### 🧾 第一步：给 Markdown 增加“行为字段”
以后每笔都多写 3 个：

```yaml
market_cycle: 上升期   # 上升期 / 退潮期 / 混沌期
emotion_bias: 急躁      # 冷静 / 急躁 / 恐惧 / 贪婪
execution_error: 追高    # 无 / 追高 / 抄底过早 / 止损慢
```
#### 🧠 第二步：Hugo 输出为数据
```go
<script>
const trades = [
{{ range where .Site.RegularPages "Type" "strategy" }}
{
  result: "{{ .Params.result }}",
  cycle: "{{ .Params.market_cycle }}",
  emotion: "{{ .Params.emotion_bias }}",
  error: "{{ .Params.execution_error }}"
},
{{ end }}
];
</script>
```
#### 📉 第三步：识别“亏损触发器”
```html
<canvas id="emotionLoss"></canvas>
<script>
const emoStats = {};

trades.forEach(t=>{
 if(!emoStats[t.emotion]) emoStats[t.emotion]={loss:0,total:0};
 emoStats[t.emotion].total++;
 if(t.result==="亏损") emoStats[t.emotion].loss++;
});

new Chart(document.getElementById('emotionLoss'),{
 type:'bar',
 data:{
  labels:Object.keys(emoStats),
  datasets:[{
   label:'该情绪下亏损率%',
   data:Object.values(emoStats).map(v=>(v.loss/v.total*100).toFixed(1))
  }]
 }
});
</script>
```
#### ☠ 第四步：找出“死亡组合”
```html
<canvas id="comboLoss"></canvas>
<script>
const combo={};

trades.forEach(t=>{
 const key = t.cycle+"-"+t.emotion;
 if(!combo[key]) combo[key]={loss:0,total:0};
 combo[key].total++;
 if(t.result==="亏损") combo[key].loss++;
});

new Chart(document.getElementById('comboLoss'),{
 type:'bar',
 data:{
  labels:Object.keys(combo),
  datasets:[{
   label:'组合亏损率%',
   data:Object.values(combo).map(v=>(v.loss/v.total*100).toFixed(1))
  }]
 }
});
</script>
```
#### 最终输出
🎯 系统最终会告诉你类似：
```text
行为模式	亏损率
退潮期 + 急躁	82% ☠
混沌期 + 追高	76% ☠
上升期 + 冷静	23% ✅
```


### 🧬 交易性格 AI 报告系统（规则引擎版）
我们不需要真 AI，用规则就能实现“像 AI 一样”。
比如：

*“你在连续盈利后 3 笔内会放松风控”，“你在市场冷清时会无聊开仓”。*

这一步开始，系统从“统计你”变成：🤖 预测你会犯错。

不是玩笑，这是行为量化的核心。

#### 目标：

页面自动出现这种话：

⚠ 你在【连续盈利后】风险偏好上升

⚠ 你在【退潮期】仍然强行交易

⚠ 你在【持仓>3天】后容易止损变慢


#### 🧾 第一步：再加两个字段（关键）
```yaml
streak_before: 2      # 开仓前连续盈利笔数（亏损写负数）
confidence: 高        # 低 / 中 / 高（主观把握）
```
#### 🧠 第二步：Hugo 输出数据
```go
<script>
const trades = [
{{ range where .Site.RegularPages "Type" "strategy" }}
{
 result: "{{ .Params.result }}",
 days: {{ .Params.holding_days }},
 cycle: "{{ .Params.market_cycle }}",
 emotion: "{{ .Params.emotion_bias }}",
 error: "{{ .Params.execution_error }}",
 streak: {{ .Params.streak_before }},
 confidence: "{{ .Params.confidence }}"
},
{{ end }}
];
</script>
```
#### 🧮 第三步：行为规则引擎
```html
<div id="aiReport" style="background:#111;padding:15px;border-radius:8px"></div>

<script>
let report = [];

/* 规则1：盈利后膨胀 */
const afterWin = trades.filter(t=>t.streak>=2);
const lossAfterWin = afterWin.filter(t=>t.result==="亏损").length / (afterWin.length||1);
if(lossAfterWin>0.5){
 report.push("⚠ 连续盈利后你的亏损率明显上升，存在自信膨胀");
}

/* 规则2：退潮期强行交易 */
const badCycle = trades.filter(t=>t.cycle==="退潮期");
const badCycleLoss = badCycle.filter(t=>t.result==="亏损").length / (badCycle.length||1);
if(badCycleLoss>0.6){
 report.push("⚠ 你在退潮期仍频繁出手，这是主要回撤来源");
}

/* 规则3：拿太久变钝 */
const longHold = trades.filter(t=>t.days>3);
const longLoss = longHold.filter(t=>t.result==="亏损").length/(longHold.length||1);
if(longLoss>0.6){
 report.push("⚠ 持仓时间过长会削弱你的执行力");
}

/* 规则4：情绪驱动错误 */
const emoError = trades.filter(t=>t.emotion==="急躁" && t.result==="亏损");
if(emoError.length>3){
 report.push("⚠ 急躁情绪是你最稳定的亏损触发器");
}

document.getElementById("aiReport").innerHTML =
 "<h3>🧬 交易行为诊断报告</h3>" +
 (report.length?report.join("<br>"):"暂无明显行为风险，继续保持");
</script>
```
#### 🎯 现在系统能做什么
它不再告诉你“这笔亏损原因”
它会告诉你：

**“你在这种状态必亏。”**

这就是：

*Behavioral Risk Control（行为风控）*

如果🧠 系统在你新建策略时直接提示：
“当前市场 + 你的情绪状态 = 历史亏损概率 73%”岂不是更好？

### 🚨 开仓前风险提示系统（实时自我风控）

以后每写一篇新策略草稿，页面顶部自动出现：

**❌ 当前环境 + 你的状态 = 历史亏损概率 68%
⚠ 建议降仓位**

#### 🧠 核心思想
用你历史 Markdown 数据
去判断 “此刻的你” 是否处在高风险状态

不是预测市场，是预测你自己。

#### 🧾 一、当前这笔策略（草稿页）要有这些字段
```yaml
market_cycle: 退潮期
emotion_bias: 急躁
confidence: 高
```
这代表 你现在的状态。

#### 🗄 二、历史交易数据库（之前已经有）
我们已经有：

```js
const trades = [...]
```
#### 🚦 三、风险评估引擎
在策略模板页加入：

```html
<div id="riskBox" style="padding:15px;border-radius:8px;margin:10px 0;"></div>

<script>
const current = {
 cycle: "{{ .Params.market_cycle }}",
 emotion: "{{ .Params.emotion_bias }}",
 confidence: "{{ .Params.confidence }}"
};

let riskScore = 0;
let reasons = [];

/* 规则1：市场周期风险 */
const sameCycle = trades.filter(t=>t.cycle===current.cycle);
const cycleLoss = sameCycle.filter(t=>t.result==="亏损").length/(sameCycle.length||1);
if(cycleLoss>0.6){
 riskScore+=2;
 reasons.push("该市场周期历史亏损率高");
}

/* 规则2：情绪风险 */
const sameEmotion = trades.filter(t=>t.emotion===current.emotion);
const emoLoss = sameEmotion.filter(t=>t.result==="亏损").length/(sameEmotion.length||1);
if(emoLoss>0.6){
 riskScore+=2;
 reasons.push("该情绪状态下你易犯错");
}

/* 规则3：自信过高风险 */
const highConf = trades.filter(t=>t.confidence==="高");
const confLoss = highConf.filter(t=>t.result==="亏损").length/(highConf.length||1);
if(confLoss>0.5 && current.confidence==="高"){
 riskScore+=1;
 reasons.push("高自信时你的风控会放松");
}

/* 结果判定 */
const box = document.getElementById("riskBox");

if(riskScore>=4){
 box.style.background="#3a0000";
 box.innerHTML = "🚨 高风险交易环境<br>" + reasons.join("<br>") + "<br>建议：降低仓位或放弃";
}
else if(riskScore>=2){
 box.style.background="#3a2a00";
 box.innerHTML = "⚠ 中等风险<br>" + reasons.join("<br>") + "<br>建议：控制仓位";
}
else{
 box.style.background="#002b00";
 box.innerHTML = "✅ 风险可控，执行纪律即可";
}
</script>
```
#### 🎯 它在干嘛？

当你准备交易时：

系统在问：
```text
问题	                来源
这种市场你以前赚钱吗？	历史统计
你这种情绪会乱操作吗？	行为记录
你自信时会膨胀吗？	    过去失误
```
然后给出一句话：

*“你现在不是理性的你”*

🧬 现在拥有的系统层级
```text
层级	功能
记录层	Markdown 交易日志
统计层	胜率、收益曲线
行为层	找出你容易亏的状态
预测层	在你犯错前提醒你 ← 现在
```
这已经是：

🧠 行为量化风控系统（个人版）

如果再往上走，就是：

🔮 “仓位建议自动计算器”
根据风险评分直接告诉你：

建议仓位 = 0.3

那就是真正的“交易操作系统”。

### 🧠📊 带仓位控制的个人交易操作系统

这一步的作用只有一个：

❗ 不再靠感觉决定仓位

而是：

风险越高 → 系统自动让你变怂

#### 🎯 目标
根据刚才算出的 ```riskScore```
自动给出：
```text
风险等级	建议仓位
低风险	0.8
中风险	0.5
高风险	0.2
极高风险	0（禁止交易）
```
🧮 在刚才风险代码下面追加
```html
<script>
/* ===== 仓位建议系统 ===== */
let position = 0.8;

if(riskScore>=6) position = 0;
else if(riskScore>=4) position = 0.2;
else if(riskScore>=2) position = 0.5;

const posBox = document.createElement("div");
posBox.style.marginTop="10px";
posBox.style.fontSize="18px";

if(position===0){
 posBox.innerHTML="⛔ 建议仓位：0 —— 当前不适合出手";
 posBox.style.color="red";
}
else{
 posBox.innerHTML="📦 建议仓位："+position;
 posBox.style.color="#0f0";
}

document.getElementById("riskBox").appendChild(posBox);
</script>
```
#### 🧠 背后的专业逻辑
仓位 = *f*(*市场状态, 个人情绪, 历史行为错误*)
这就是常说的：

>Position Sizing by Behavioral Risk

## Markdown与Hugo的本质
很多人都以为Markdown = *写文章的格式*，

而现在理解的是：

Markdown = *人类可读的数据库记录格式*。

如果按照```.md 文件 = 数据对象```这个逻辑推下去，

“这个能不能做成字段？”

“这个能不能自动生成？”

“这个页面能不能查询出来？”

这就是从“写内容”变成“设计信息系统”。

而最妙的是：

工具仍然只是 —— 文本文件。

如果把Hugo直接当“知识系统”，

根本不当网站用，值得记录的只是Markdown 文件库
    
Hugo 只是本地“查询引擎”。

那么问题来了，知识库必然有私有和公开两种属性的。

如何来控制呢？

### 控制访问权限

#### 初级：不部署到公网

最简单：

只在本地跑```hugo server```,浏览器访问：```http://localhost:1313```,只有你知道怎么看，想公开就用隧道或者穿透，如果连局域网都不想放开，就关闭hugo。

#### 🥈 中级：部署了，但加密码

用 ```Nginx``` 加个最基础的认证：
```yaml
auth_basic "Private Site";
auth_basic_user_file /etc/nginx/.htpasswd;
```
或者使用```FixIt```主题的```admonition```或其他内置组件,比如```Details```。

没密码外人打不开。

#### 🥇 高级：直接当“本地知识系统”

根本不当网站用，而是：
```text
Markdown 文件库
    ↓
Hugo 只是本地“查询引擎”
```

更进一步：

- 放在加密硬盘

- Git 私有仓库备份

- 不暴露公网端口

这已经是“离线知识数据库”。

当然我建博客是为了“*被看见*”，但是不想让人“*全看见*”。

所以最好是博客 自动抽取一部分内容 → 生成“对外公开版网站”

不想公开的永远也不展示。

我们接着来折腾**Front Matter**

来实现同一套 Markdown → 自动生成“公开版”和“私密版”两个网站


#### 🧩 Front Matter控制访问权限的核心思路
给每篇 md 加一个字段：

```yaml
visibility: public   # 或 private
```
于是你所有内容自动分层。

##### 🥇 第一步： Front Matter写法
```yaml
---
title: 回售博弈策略
visibility: private
risk_level: 高
---
这是是保密的正文……
```
---
```yaml
---
title: 可转债基础知识
visibility: public
---

这是对外展示内容……
```
##### 🥈 第二步：做两个 Hugo 配置文件
```yaml
config-public.yaml
yaml
params:
  mode: public
  ```
```yaml
config-private.yaml
yaml
params:
  mode: private
  ```
##### 🥉 第三步：在模板里加“过滤器”
在你列表页模板里：

```go
{{ $mode := .Site.Params.mode }}

{{ range where .Site.RegularPages "Params.visibility" $mode }}
  <h2>{{ .Title }}</h2>
{{ end }}
```
意思是：
```text
构建模式	会显示什么
public	只显示 visibility: public
private	只显示 visibility: private
```
##### 🚀 第四步：分别生成两个网站
生成公开站
```bash
hugo --config config-public.yaml -d public_site
```
生成私密站
```bash
hugo --config config-private.yaml -d private_site
```
结果：

```bash
/public_site   → 可上传公网
/private_site  → 只本地自己看
```
同一套 md 文件，自动分裂成两个世界。


这样我们就实现了用字段来控制输出的目的。


##### 🔒 网站形态
```text
层级	    用途
Private DB	策略、模型、真实记录
Semi-Public	精简后的方法论
Public Site	科普/展示
```
全部来自同一个 Markdown 数据库。

#### Front Matter控制显示内容的核心思路
有时候我们只是想隐藏一些数据，比如购入价格，比如消息来源，手机号码等等，并不想整篇文章被设为```private```。因为公开站和私密站都要发布这篇文章，只是内容有所删减而已。
其实也是可以使用*Front Matter*来控制。

##### 🧠 核心逻辑
一篇原始 md：

```cpp
真实数据库记录
        ↓
构建 public 版本时
        ↓
自动删掉敏感字段 + 敏感内容
```
##### 🧩 第一步：给敏感字段打标签
```yaml
---
title: 盟升转债回售博弈
visibility: private
buy_price: 190
position_size: 0.4
confidence_score: 8
public_note: 回售博弈是核心逻辑
---
正文：
真实策略过程：
买在 190，计划 210 减仓。
```
这里面几个关键字段：
```text
字段	        用途
buy_price	    真实数据（不外泄）
position_size	不公开
public_note	    专门写给公开版看的
```
##### 🥈 第二步：模板中做“模式判断”
在模板顶部：

```go
{{ $mode := .Site.Params.mode }}
🔒 私密模式：全部显示
go
{{ if eq $mode "private" }}
买入价：{{ .Params.buy_price }}  
仓位：{{ .Params.position_size }}
{{ end }}
🌐 公开模式：只显示“公开信息”
go
{{ if eq $mode "public" }}
策略说明：{{ .Params.public_note }}
{{ end }}
```
##### 🥉 第三步：正文自动“打码”
正文可以写：

```cpp
买入价是{{</* private */>}}190{{</* /private */>}}
```
然后做个 ```shortcode```：

```/private/layouts/shortcodes/private.html```
```go
{{ if eq site.Params.mode "private" }}
  {{ .Inner }}
{{ end }}
```
公开构建时，这部分直接消失。

##### 🚀 生成效果
```text
内容	 私密站	 公开站
买入价	 ✔ 显示	 ❌ 消失
仓位	 ✔	     ❌
逻辑	 ✔	     ✔
```
##### 🎯 网站形态
```text
层	    信息密度
私密库	100%
公开站	30%（认知，不是数据）
```
这和机构做研究报告的方式一样,也就是所谓的**付费可看更多**。

---
这是我目前手写最长的文章了，累死了，后面再说怎么在FM里配置字段进而在VS里显示输入框吧。

>文中代码未经测试。由Gemini输出，Qoder验证了部分内容，Chatgpt和Deepseek API对此文亦有贡献。





---

> 作者: Mavelsate  
> URL: /posts/hugo%E4%B8%8Emarkdown%E7%9A%84%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A8/  


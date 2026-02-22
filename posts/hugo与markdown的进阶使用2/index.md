# 基于Shortcodes的Hugo进阶使用——功能扩展与美观方向

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hugo 本身没有像 WordPress 那样“一键安装”的插件后台，但它通过几种非常硬核的方式实现了类似插件的功能。

> {{< link href="https://gohugo.com.cn/documentation/" content="Hugo官方站" title="参考资料" >}}
## 三种方式
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;对于喜欢折叠、私密内容、甚至量化分析展示的博主来说，这几种“插件”形式一定会用到：

### 1. Shortcodes（短代码）：最像插件的功能
它是 Hugo 的“宏指令”，可以让你用一行简单的代码调用复杂的 HTML 模块。

    用途：插入 B 站视频、推特卡片、GitHub 仓库卡片、或是“私密隐藏框”。

    FixIt 自带插件：FixIt 主题内置了非常多的 Shortcodes，比如：

    {{</* admonition */>}}：漂亮的消息提示框。

    {{</* typeit */>}}：打字机动画效果。

    {{</* echarts */>}}：可以直接在 Markdown 里写 JSON 生成动态图表。
*Shortcodes（短代码）* 是 Hugo 专门为 Markdown 设计的“快捷指令”。因为 Markdown 本身功能有限（只能排版文字、图片），如果想在文章里插一个 B 站视频、一个折叠框、或者一个动态图表，Markdown 就搞不定了。

Shortcodes 就是用来实现这些高级功能的占位符。
1. 基础语法Shortcodes 必须写在双花括号 {{ }} 里，
   
   主要有两种外形：

   A. 单行指令（没有内容，只有参数）适用于插入外部视频、链接、按钮。语法：```{{</* 名字 参数1="值" 参数2="值" */>}}```例子（插入 B 站视频）：```{{</* bilibili "BV1xxxx" */>}}```
   
   B. 成对标签（包裹一段内容）适用于折叠框、代码块、高亮提示。语法：
   ```Markdown
   {{</* 名字 */>}}
   这里是被包裹的内容
   {{</* /名字 */>}}

注意：

1. 两种括弧的区别（重点！）
   
   用 Shortcodes 时会发现有两种括号，区别非常大：
   
   ```{{</* ... */>}}``` (尖括号)：告诉 Hugo：里面的内容直接渲染成 HTML，不要再去解析里面的 Markdown 了。
   
   常用场景：视频、图片、按钮。
   
   ```{{%/* ... */%}}``` (百分号)：告诉 Hugo：把里面的内容当成 Markdown 重新解析一遍。
   
   常用场景：如果想在折叠框里再写加粗、超链接，就用这个。
2. 常见的内置 Shortcodes (直接就能用)
   
   Hugo 默认就带了一些功能，不需要主题支持也能跑：
   ```bash
   名字	      功能	               例子
   relref	站内文章跳转	[点我]({{</* relref "post.md" */>}})
   youtube	插入 YouTube 视频	{{</* youtube id="ID" */>}}
   gist	引用 GitHub Gist 代码	{{</* gist 用户名 ID */>}}
   figure	带标题和说明的图片	{{</* figure src="1.jpg" title="说明" */>}}
   ```
   
3. FixIt 主题的特色 Shortcodes
   
   FixIt，它额外送了很多“大招”：
   ```
   typeit：打字机动画。
   
   echarts：画你最爱的量化图表。
   
   mermaid：画流程图。
   
   link：把普通的超链接变成带边框的精美卡片。
   
   admonition：各种颜色的提示框（Tip, Note, Warning, Danger）。
   ```
   测试一下：

   ```Markdown
   {{</* typeit tag=h3 */>}}
   耶利亚，我一定要找到她...
   {{</* /typeit */>}}
   ```
   效果如下:

   {{< typeit speed=100 id="yeliya-real">}}耶利亚，我一定要找到她...{{< /typeit >}}

### 2. Hugo Modules（模块）：现代化的插件系统
这是 Hugo 较新版本引入的功能，基于 Go Modules。它允许直接在配置文件里通过 URL 引用远程的“插件”。

   例子：想给博客加一个搜索增强插件或特定的数学公式渲染器，只需要在配置里加上 GitHub 链接，Hugo 编译时会自动下载。

### 3. Partial Templates（局部模板）
如果想在侧边栏加一个“量化策略回测实况”或者“今日收益”，通常会修改 ```layouts/partials/``` 下的 HTML。这相当于你自己写了一个小挂件。

## 常见的Shortcodes（短代码）
### A. 想做折叠框
不需要自己写插件，用内置的 ```admonition```：

```bash
{{</* admonition type="abstract" title="私密内容" open=false */>}}
#这里是正文。
{{</* /admonition */>}}
```
*open=false 表示默认折叠*。

效果如下：

{{< admonition type="abstract" title="私密内容" open=false >}}
#这里是正文。
{{< /admonition >}}

当然除了```abstract```,还有其他的类型供选择：

- note/ quote：白色（适合写大段文字）

- tip / success：绿色（适合写“已解决”、“获利”）

- info / abstract：蓝色（适合写“基本信息”）

- warning / note：黄色（适合写“白银风险提示”）

- danger / error：红色（适合写“回撤风险”、“报错点”）

- question：紫色（适合写“思考题”）
### B. 想展示图表

FixIt 集成了 ```ECharts```：

```bash
{{</* echarts */>}}
{
  "title": { "text": "人口变动" },
  "xAxis": { "data": ["2024", "2025", "2026"] },
  "yAxis": {},
  "series": [{ "type": "line", "data": [220, 180, 190] }]
}
{{</* /echarts */>}}
```
效果如下;

{{< echarts >}}
{
  "title": { "text": "人口变动" },
  "xAxis": { "data": ["2024", "2025", "2026"] },
  "yAxis": {},
  "series": [{ "type": "line", "data": [220, 180, 190] }]
}
{{< /echarts >}}

进阶使用：

平时用 *Jupyter Notebook* 调代码，用 Python 的 ```pyecharts``` 库生成配置。

在 *Jupyter* 里把回测结果跑出来。

使用 ```chart.dump_options_with_quotes()``` 导出 *JSON*。

粘贴到 Hugo 的 {{</* echarts */>}} 块里。

### C. Mermaid：用代码画流程图

不需要用 *Visio* 画图再截图。

玩法：

```bash
{{</* mermaid */>}}
graph TD
A[黄金价格跌破布林线下轨] --> B{是否有持仓?}
B -- 无 --> C[买入 20% 仓位]
B -- 有 --> D[保持观察]
{{</* /mermaid */>}}
```
它会直接在网页上渲染成一张高大上的逻辑流程图。

效果如下：
{{< mermaid >}}
graph TD
A[白银价格跌破布林线下轨] --> B{是否有持仓?}
B -- 无 --> C[买入 20% 仓位]
B -- 有 --> D[保持观察]
{{< /mermaid >}}

## 汇总
### 1. 内容呈现类（让文章不枯燥）
   
Admonition (警告框)： 这是最常用的。用来标记“风险提示”或“核心结论”。

Typeit (打字机)： 让某段话像代码输入一样动起来。

Timeline (时间轴)： 非常适合记录日记或学习历程。

### 2. 交互与多媒体类
   
Music (音乐播放器)： FixIt 支持 Aplayer，可以在文章里插一首轻音乐。

BiliBili / YouTube： B 站视频，直接一行代码嵌入，不需要去复制复杂的 HTML。

Friend (友链卡片)： 可以用这种卡片式布局展示朋友们的博客。

### 3. 数据与极客工具

Mermaid (流程图)： 用文字画逻辑图。

ECharts (动态图表)： 用来展示曲线。

Mapbox / Google Maps： 在博客里展示所在的位置（或者旅游打卡），它也支持地图嵌入。

### 4. 博客管理“黑科技”
Content Encryption (内容加密)： FixIt 有内置的内容保护。 FixIt 支持通过 password 参数来加密部分段落（需要特定配置）。

Search (本地搜索)： 它内置了 Algolia 或 Fuse.js 搜索。

SEO 自动优化： 它会自动生成 JSON-LD 结构化数据，让百度、谷歌更容易收录站点。

### 5. “私人定制”插件
还可以去 layouts/shortcodes/ 下自己写。

比如：

自定义个“聚宽代码块”：带上聚宽的 Logo，一键点击跳转到 JoinQuant 官网。

个股走势插件：引用外部 API（如腾讯财经），输入代码 SH600000 自动显示实时股价。

### 6. 数字化家庭档案 (Shortcodes + Gallery)
给宝宝拍的照片、外出旅游视频，不一定要全发朋友圈。

隐藏技能：画廊模式 (Gallery)

玩法：FixIt 支持相册功能。可以把照片放在 assets 文件夹，用一行代码生成一个带灯箱效果（点击放大、左右滑动）的精美相册。

家庭意义：配合 Hugo 的密码保护功能，可以做一个“旅游”分区，只分享给家人看。

### 7. PVE 小主机状态监控 (Shortcodes + Iframe)
我有 8845HS 和 i9 两台 PVE 主机，折腾了不少 Docker 服务。

隐藏技能：外链嵌入 (Iframe)

玩法：如果本地跑了 Uptime Kuma（监控服务是否在线）或者 Netdata（监控 CPU/内存），可以直接把监控图表嵌入博客的某个“后台页面”。

### 8. 极客刷机/避坑指南 (Code Group & Steps)
在写手机刷类原生系统或者部署 Hugo 教程时，步骤往往很杂。

隐藏技能：代码分组 (Code Group)

玩法：可以把“Windows 环境”和“Linux 环境”的安装命令放在同一个切换卡里。读者点哪个，就显示哪个环境的代码，不用长篇大论。

步骤条 (Steps)：FixIt 允许用竖向或横向的步骤条展示“装机三部曲”，逻辑感极强。

### 9. 自动化“稍后阅读”书签 (Data Files)
在研究量化或技术时，肯定有很多参考链接。

隐藏技能：本地数据渲染 (Data Templates)

玩法：不需要在 Markdown 里一行行写链接。可以维护一个 links.yaml 文件，Hugo 会自动根据这个文件生成一个带图标、带描述的“导航页”或“资源推荐页”。

### 10. 多语言支持（为了以后国际化，或者纯粹为了帅）
隐藏技能：i18n

玩法：Hugo 的多语言支持是世界顶级的。

效果：网页右上角会出现一个切换按钮，点击后全文丝滑切换成英文，URL 也会变成 /en/...，瞬间提升博客的逼格。

### 11. 社交互动与评论（非静态的“静态博客”）
隐藏技能：Waline / Waline / Giscus

玩法：FixIt 完美集成这些评论系统。建议用 Giscus，它是基于 GitHub Issues 的，非常适合把代码托管在 GitHub 的博主。读者可以用 GitHub 账号直接给你留言讨论回测策略。

### 12. 自动生成“读书笔记 / 观影记录” (Archetypes & Data)


隐藏技能：Archetypes（内容模板）

玩法：可以定义一个 book.md 模板。当输入 hugo new books/python-quant.md 时，文件会自动带上 书名、作者、评分、阅读状态 等参数。效果：配合 FixIt 的布局，可以一键生成像豆瓣一样的“已看/想看”列表，甚至自动抓取封面图。

### 13. 数学公式的高级渲染 (KaTeX/MathJax)

隐藏技能：内置数学引擎

玩法：在 Front Matter 里设置 math = true。
效果：可以直接写 LaTeX 代码：$$\text{Sharpe Ratio} = \frac{R_p - R_f}{\sigma_p}$$网页会渲染成教科书级别的精美公式。量化策略里总会涉及到 \(\sigma\)（标准差）、\(\beta\)（贝塔系数）或者复杂的微积分公式。


### 14. 内容的分支预览 (Branch Previews)

隐藏技能：Netlify/Vercel/GitHub Actions 部署预览

玩法：如果开了一个名为 test-feature 的 Git 分支，部署工具会自动生成一个独立的测试链接。场景：在测试新的 ECharts 模板，发给朋友确认没问题后，再合并到主分支发布，整个流程非常专业。在折腾 Hugo 进阶功能时，也不怕把现在的博客改坏了。*这个功能似乎没有必要，因为本地可以预览。*

### 15. 自动化“说说”或“微语” (Shortlog)

不想写长文章，只想发一句“今天挣钱了，开心”或者“妹妹今天会爬了”。

隐藏技能：Headless Bundle（无头内容包）

玩法：创建一个不生成独立页面的内容集合。

效果：在博客首页或者侧边栏开辟一个小区域，实时滚动显示这些简短的动态，就像自己的私有微博。比如发一个“今天挣钱了。”

### 16. 跨文章的“知识图谱” (Taxonomies)

隐藏技能：自定义分类法 (Taxonomies)

玩法：除了 Tags 和 Categories，可以自创分类。比如 ```Series: [学习聚宽]```，或者 ```Difficulty: [进阶]```。

效果：Hugo 会自动为生成这些维度的汇总页，方便梳理自己的知识库。毕竟文章多了以后单纯靠“分类”和“标签”已经很难找东西了。

### 17. 短链接跳转 (Aliases)

隐藏技能：别名系统 (Aliases)

玩法：在文章开头加一行 ```aliases: ["/hj/"]```。

场景：别人只要输入 ```kangjian.site/hj/```，就能直接跳转到这篇文章。非常适合在微信或者短视频里口播。

### 18. 自动生成 Open Graph 封面图

当把博客分享到微信或推特时，通常会显示一张缩略图。

隐藏技能：Internal Templates

玩法：Hugo 可以自动根据文章标题、作者和日期，在后台“合成”一张带文字的封面图片。效果：不需要你自己去一张张配图，分享出去的链接自动带上高大上的预览卡片。

### 19. 性能分析器 (Hugo Fingerprinting)

隐藏技能：Asset Pipeline

玩法：Hugo 编译时会给 CSS/JS 文件名加上一串哈希值（比如 *style.abcd123.css*）。

意义：这意味着更新博客后，读者的浏览器会立刻加载新版，不会因为缓存导致页面排版错乱。

### 20. 自建私有构建集群

隐藏技能：Self-hosted Runner

玩法：在本地的PC上跑一个 GitHub Actions Runner。*比如我的8845或者I9。*

场景：当提交代码时，不再消耗 GitHub 免费的额度，而是直接在自己主机上秒级完成编译和推送，速度还能再快一截。


### 21. 自动化与效率类
Archetypes 自动脚本：定义文章模板时，可以使用``` {{ .Date }} ```自动填充当前日期，甚至可以用脚本自动抓取当天的白银价格填入 Front Matter。

Hugo Pipe 资源处理：Hugo 能在编译时直接把多张小图标（SVG）合并成一张，减少网页请求次数。

Git Info 集成：开启 ```enableGitInfo = true```，文章底部会自动显示“```最后由 [你的名字] 修改于 [Git提交时间]```”，极具极客范。

Makefile 自动化：可以写个 Makefile，一行命令 ```make deploy``` 同时完成：本地编译、清理旧文件、上传、刷新缓存。

Environment Variable (环境变量)：根据是 development 还是 production 环境展示不同内容。比如本地预览时显示“调试信息”，线上则隐藏。

### 22. 内容排版与视觉类
Code Block Copy (代码一键复制)：FixIt 内置，方便别人点击一下就能把 Python 代码拷走。

Math Formula (LaTeX)：支持行内 $E=mc^2$ 和块状公式，是写算法的刚需。

Emoji Support：开启 enableEmoji = true，直接输入 ``` :rocket: ``` 就能显示 🚀，增加博文趣味性。

Table of Contents (自动目录)：FixIt 侧边栏会自动根据 ```标题```生成目录，点击平滑滚动。

B站/网易云内置 Shortcodes：不需要粘贴复杂的 ```<iframe>```代码，一行``` {{</* bilibili ... */>}} ```搞定。

### 23. 数据与逻辑处理类

Data Driven Pages (数据驱动页面)：把账户历史存成 ```data/history.json```，Hugo 可以在全站任何地方调用这些数据生成动态表格。

Taxonomy Terms (自定义分类)：除了标签，你可以定义 ```Broker: [聚宽, 盈透]```这种分类，点击“```聚宽```”就能看到所有相关文章。

Scratch 临时变量：在复杂的 Shortcode 逻辑里，用 Scratch 做加减乘除计算，比如自动算出本月量化策略的胜率。

Cross-Reference (跨文章引用)：使用```relref```链接，如果目标文章文件名改了，Hugo 在编译时会报错提醒你，防止死链。

Content Multi-format (多格式输出)：同一篇文章可以同时输出成 .```html（网页）```和 ```.json（API）```，甚至可以输出成```.txt```供AI 助手读取。

### 24. 交互与隐私类

Content Password (内容加密)：FixIt 支持对特定页面设置访问密码，适合存放私人的家庭照片或未公开的内容。

Search Indexing (本地搜索)：通过 ```fuse.js``` 实现纯前端搜索，不需要服务器数据库，响应极快。

PWA (渐进式 Web 应用)：让博客像 App 一样“安装”在手机桌面，甚至在没网时也能阅读已缓存的文章。

RSS Feeds (自动订阅)：自动生成 RSS，方便你自己用 ```ReadWise``` 或 ```NetNewsWire``` 追踪自己的博文。

Comments System (Giscus/Waline)：利用 ```GitHub``` 的 ```Discussion``` 功能做评论区，非常适合与读者讨论代码。

### 25. 深度自动化与集成 (DevOps 视角)
Hugo Remote Data (远程数据抓取)：```resources.GetRemote``` 指令可以在编译时，直接从*JoinQuant*或其他金融 API 抓取实时的*JSON*数据。

Webmention (反向引用)：当别人在推特或他们的博客上提到你的链接时，你的文章底部能自动显示这些互动。

Build Stats (构建报告)：利用 ```hugo --template-metrics``` 查看哪个页面的模板渲染最慢，精准优化那 3 秒的编译时间。*现在编译其实还不到1s。*

Minification Pipeline (极简流水线)：除了 HTML 压缩，Hugo 还能对 SVG 图片进行压缩，删除冗余的 XML 标签。

GitHub Action Cache：在 Actions 里缓存 Hugo 的 *resources* 文件夹，能让重复构建的速度从 3 秒缩短到 1 秒内。

### 26. 极致排版与用户体验
Responsive Images (响应式图片处理)：Hugo 可以自动生成 *webp* 格式的图片副本，并根据读者是用电脑还是用平板自动加载不同分辨率的图。

Blur-up Placeholder (高斯模糊占位)：图片加载完成前，先显示一张极小的模糊图，这种效果在 *Medium* 这种大站很流行。

Drop Caps (首字下沉)：通过 *CSS* 注入，让你的文章看起来像纸质杂志一样高级。

Reading Time (预估阅读时间)：自动算出“```阅读本文约需 5 分钟```”，帮你留住那些犹豫要不要读完的长文读者。

Custom 404 Page：做一个带彩蛋的 404 页面。

### 27. 数据与逻辑的“黑科技”
Internal Shortcodes (内置短代码)：Hugo 自带了```ref```, ```relref```, ```youtube```, ```vimeo```, ```gist``` 等，不需要主题支持也能用。

Nested Shortcodes (嵌套短代码)：你可以在一个折叠框里套一个图表，图表里再套一个代码块。

Params Metadata (自定义元数据)：在 *Front Matter* 里自创变量，比如 ```is_silver_related: true```，然后侧边栏自动推荐所有跟白银相关的文章。

Local Links Translation：如果你换了域名，利用 ```content``` 里的替换逻辑，可以批量一键重定向旧链接。

Schema.org (结构化数据)：自动生成让搜索引擎心醉的代码。

### 28. 特殊玩法
Print-ready Stylesheet (打印优化)：设置特定的 *CSS*，让你的文章打印出来后没有导航栏，全是干净的文字，方便在纸上推演。

Offline Search (离线搜索)：利用 *Service Worker*，即便你在地铁里没信号，也能搜索博客里的历史笔记。

Dynamic Copyright Year：用代码自动获取当前年份，省得每年 1 月 1 号还要手动去改页脚。

Content Summary Splitting (摘要精准控制)：通过 ``` `` ``` 手动控制首页显示的摘要长度，不会出现文字被生硬切断的情况。

Hugo Server Hot Reload (热更新预览)：你在电脑上保存 *Markdown*，你手边的手机页面会实时自动刷新显示新内容。


## 未来计划
1. 可以尝试在博客里加一个 “实盘周报” 的 Shortcode。每周只需要改一个 yaml 文件里的数字，博客首页的统计图、表格、以及分析文字会自动全部更新。

2. 再加一个能自动计算“本周盈亏百分比”并根据红绿（涨跌）自动变色的 Hugo 逻辑代码。

    只需要填入两个价格，剩下的交给 Hugo 处理。

3. 写一个 ```resources.GetRemote``` 的代码框架，让你以后写文章时，只需要点一下“发布”，数据就自动从 *PVE 小主机（Jupyter主机）* 同步到博客上。   

   场景想象：写文章时，不需要手动截图。在代码里写： ```{{/* $data := getJSON "私有 API "*/}}``` Hugo 编译时，自动去抓最新的回测曲线数据，直接在网页上画出来。博客就不再是“陈旧的日记”，而是一个半自动化的实盘看板。

4. 

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/hugo%E4%B8%8Emarkdown%E7%9A%84%E8%BF%9B%E9%98%B6%E4%BD%BF%E7%94%A82/  


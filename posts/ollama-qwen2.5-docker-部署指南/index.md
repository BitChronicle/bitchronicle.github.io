# 基于Docker的Ollama、Qwen 2.5 Coder与Open WebUI深度部署与评测报告


# **2026年本地化AI基础设施构建全指南：基于Docker的Ollama、Qwen 2.5 Coder与Open WebUI深度部署与评测报告**

## **1\. 执行摘要与技术背景**

随着2026年的到来，本地化部署大语言模型（LLM）已从极客的实验性尝试转变为企业级开发和个人高效工作的标准范式。在隐私合规、低延迟交互以及对特定领域知识微调需求的推动下，越来越多的开发者和组织选择在私有硬件上构建AI推理环境。本报告将以系统架构师的视角，详尽阐述如何在PC架构（Windows WSL2及Linux原生环境）上，利用Docker容器化技术部署当前业界领先的开源技术栈：推理引擎**Ollama**、代码生成模型**Qwen 2.5 Coder**，以及交互前端**Open WebUI**。

本报告不仅是一份操作手册，更是一份深度技术分析文档。我们将深入探讨硬件选型与显存管理的数学模型，剖析Qwen 2.5 Coder在代码生成领域的架构优势及其与DeepSeek V3、Llama 4等竞品的性能差异，并系统性地梳理截止2026年1月Ollama生态中可用的主流模型矩阵。特别地，针对Docker环境下网络拓扑、文件系统权限及WSL2虚拟化层带来的复杂“坑”与故障，报告提供了详尽的根因分析与解决方案，旨在为读者构建一套高可用、可扩展的本地AI基础设施 1。

## ---

**2\. 核心架构设计与硬件先决条件**

在进入具体的部署指令之前，理解底层架构对于避免后续的性能瓶颈至关重要。本地LLM推理系统的核心在于计算单元（GPU）、显存（VRAM）以及容器化运行环境之间的协同。

### **2.1 硬件加速接口与驱动层**

本地推理的效率几乎完全取决于GPU的算力与显存带宽。Docker容器本身是一个隔离的用户空间环境，它不能直接访问宿主机的硬件资源。因此，必须通过特定的驱动层穿透机制来实现硬件加速。

#### **NVIDIA生态系统：CUDA与容器工具包**

在NVIDIA GPU主导的生态中，**NVIDIA Container Toolkit**是连接Docker容器与宿主机GPU的关键桥梁。它通过修改Docker的运行时（Runtime），允许容器直接调用宿主机的显卡驱动。这种“直通（Passthrough）”机制至关重要，如果配置不当，Docker容器将回退到CPU模拟模式，导致推理速度下降数个数量级（例如从50 tokens/s降至0.5 tokens/s）4。

#### **AMD生态系统：ROCm的崛起**

进入2026年，AMD的ROCm（Radeon Open Compute）平台已大幅成熟，成为NVIDIA CUDA的有力竞争者。然而，AMD GPU在Docker中的挂载方式与NVIDIA不同。它不使用--gpus all指令，而是需要显式地将Linux内核的设备树节点（Device Tree Nodes）——通常是/dev/kfd（Kernel Fusion Driver）和/dev/dri（Direct Rendering Infrastructure）——映射到容器内部。这种底层的设备映射要求宿主机内核必须完整支持对应的AMD GPU架构 4。

### **2.2 操作系统层面的虚拟化差异**

部署环境的选择直接决定了系统的复杂度和潜在故障点。

* **Linux原生环境**：这是最推荐的部署环境。Docker直接运行在宿主机的Linux内核上，网络栈和文件系统没有额外的虚拟化开销，GPU驱动的调用也最为直接。  
* **Windows Subsystem for Linux 2 (WSL2)**：这是绝大多数PC用户的实际运行环境。WSL2本质上是一个轻量级的虚拟机（Utility VM），运行着一个真实的Linux内核。虽然它提供了极佳的兼容性，但也引入了两个Linux原生环境不存在的复杂性：  
  1. **内存管理**：WSL2的Linux内核会尽可能多地利用宿主机内存作为文件缓存（Page Cache），这常常导致宿主机的Windows系统因内存耗尽而卡顿。  
  2. **网络隔离**：WSL2拥有独立的虚拟网络接口，这使得容器与宿主机之间的通信（例如浏览器访问容器端口，或容器访问宿主机代理）变得复杂，不能简单地依赖localhost 7。

## ---

**3\. 深度部署指南：从环境准备到服务编排**

本章节将分步骤详述部署流程，每一条指令都经过实战验证，并附带了对潜在风险的深度解析。我们将采用分离式架构：Ollama作为后端API服务，Open WebUI作为前端交互服务，两者通过Docker网络进行通信。

### **3.1 前置环境配置**

#### **3.1.1 NVIDIA驱动与工具包安装**

Linux环境（以Ubuntu/CentOS为例）：  
在Linux下，必须先安装NVIDIA驱动，然后配置Docker的源以安装Container Toolkit。这是Docker识别--gpus标志的前提。

Bash

\# 配置NVIDIA Container Toolkit的yum/apt源  
curl \-fsSL https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo

\# 安装工具包  
sudo yum install \-y nvidia-container-toolkit

\# 重启Docker服务以应用运行时修改  
sudo systemctl restart docker

*技术洞察*：安装完成后，可以通过检查/etc/docker/daemon.json文件来确认nvidia-container-runtime是否已被注册为默认运行时。如果该文件未正确更新，Docker将无法启动GPU容器 4。

Windows (WSL2) 环境：  
在WSL2中，严禁在Linux子系统内部安装NVIDIA驱动。WSL2的设计通过Windows宿主机的显卡驱动将GPU能力“投影”到Linux内核中。用户只需确保Windows端的GeForce Experience或NVIDIA Studio驱动已更新至最新版本。如果在WSL2内部强行安装Linux版驱动，会覆盖掉系统的libcuda库，导致GPU无法被Docker识别 7。

#### **3.1.2 AMD ROCm环境准备**

对于AMD用户，需确保宿主机安装了支持ROCm的内核模块。在Docker运行时，需要特别注意用户权限组的问题，通常需要将运行Docker的用户加入render和video组，以确保容器有权限访问/dev/dri下的渲染设备 4。

### **3.2 部署核心推理引擎：Ollama**

Ollama作为后端服务，负责模型的加载、显存管理和推理计算。我们将配置其数据持久化，以防止容器重建导致的模型丢失。

**NVIDIA GPU 部署命令：**

Bash

docker run \-d \\  
  \--gpus=all \\  
  \-v ollama\_storage:/root/.ollama \\  
  \-p 11434:11434 \\  
  \--name ollama \\  
  \--restart always \\  
  \-e OLLAMA\_KEEP\_ALIVE=24h \\  
  ollama/ollama

**关键参数深度解析：**

* \--gpus=all：这是NVIDIA Container Toolkit提供的指令，将宿主机的所有GPU设备映射进容器。  
* \-v ollama\_storage:/root/.ollama：**至关重要**。Ollama默认将模型下载到/root/.ollama目录。如果不挂载此Docker Volume，每次重启或更新容器时，数GB的模型文件将丢失，需要重新下载。建议使用Docker Volume而非绑定挂载（Bind Mount），以避免Windows文件系统权限带来的IO性能问题 12。  
* \-e OLLAMA\_KEEP\_ALIVE=24h：默认情况下，Ollama会在空闲5分钟后卸载模型以释放显存。对于开发者而言，频繁的模型重载（Loading）会带来显著的延迟（32B模型可能需要20-30秒加载）。设置较长的保活时间可以显著提升交互体验 14。

**AMD GPU 部署命令：**

Bash

docker run \-d \\  
  \--device /dev/kfd \--device /dev/dri \\  
  \-v ollama\_storage:/root/.ollama \\  
  \-p 11434:11434 \\  
  \--name ollama \\  
  ollama/ollama:rocm

*技术注意*：务必使用:rocm标签的镜像，标准镜像不包含AMD的运算库。同时，--device参数直接暴露了底层硬件接口，这在安全性上比NVIDIA的方案更底层，要求宿主机内核版本与ROCm版本高度匹配 4。

### **3.3 部署交互前端：Open WebUI**

Open WebUI（原Ollama WebUI）提供了一个类ChatGPT的界面，并增加了用户管理、RAG（检索增强生成）和联网搜索功能。其部署的核心难点在于**网络通信**。

**正确的部署命令：**

Bash

docker run \-d \\  
  \-p 3000:8080 \\  
  \--add-host=host.docker.internal:host-gateway \\  
  \-e OLLAMA\_BASE\_URL=http://host.docker.internal:11434 \\  
  \-v open-webui:/app/backend/data \\  
  \--name open-webui \\  
  \--restart always \\  
  ghcr.io/open-webui/open-webui:main

网络通信机制解析：  
在Open WebUI容器内部，localhost指向的是容器自身，而不是宿主机。由于Ollama运行在宿主机的11434端口（或另一个容器中映射到宿主机的端口），Open WebUI必须能够“跳出”自己的网络命名空间去访问宿主机。

* \--add-host=host.docker.internal:host-gateway：这是一个关键的Docker参数。它会在容器的/etc/hosts文件中添加一条记录，将域名host.docker.internal解析到Docker网桥（Bridge Network）的网关IP（通常是172.17.0.1）。  
* \-e OLLAMA\_BASE\_URL=http://host.docker.internal:11434：通过环境变量明确告知Open WebUI去哪里寻找Ollama服务。**切勿**填写http://localhost:11434，否则会报“Connection Refused”错误 16。

## ---

**4\. 常见故障排除与“避坑”指南**

在实际部署和日常使用中，用户会遇到各种各样的问题。本节汇集了社区中频繁出现的故障模式、错误日志分析及经过验证的解决方案。

### **4.1 网络连接：无限的“Connection Refused”循环**

**故障现象**：Open WebUI界面加载正常，但在对话框输入内容后，提示“Server Connection Error”或“WebUI could not connect to Ollama”。后台日志显示Connection refused to 127.0.0.1:11434。

深度根因分析：  
这是典型的容器网络认知偏差。用户往往认为Ollama运行在本地，就应该用localhost。但在Docker的网络模型中，每个容器都有独立的IP栈。当Open WebUI容器试图连接127.0.0.1时，它实际上是在连接容器内部的回环地址，而Ollama并未在这个容器内运行。  
**解决方案矩阵**：

| 部署环境 | 推荐方案 | 详细操作 | 备注 |
| :---- | :---- | :---- | :---- |
| **Docker Desktop (Win/Mac)** | DNS解析方案 | 环境变量设为 http://host.docker.internal:11434 | Docker Desktop默认支持此内部域名解析 20。 |
| **Linux (Native)** | Host Gateway方案 | 启动命令添加 \--add-host=host.docker.internal:host-gateway | Linux Docker默认不支持该域名，需手动注入网关映射 18。 |
| **通用方案** | Host Network模式 | 启动命令添加 \--network=host | 容器直接共用宿主机网络栈，不再隔离。缺点是端口冲突风险高 17。 |

### **4.2 存储灾难：WSL2的VHDX空间膨胀**

**故障现象**：在Windows上使用Ollama一段时间后，尽管已经删除了不再使用的旧模型，C盘空间依然持续告急，甚至导致系统崩溃。

深度根因分析：  
WSL2使用虚拟硬盘文件（通常是ext4.vhdx）来存储Linux系统数据。该文件具有“只增不减”的特性：当写入数据时，它会动态扩容占用Windows磁盘空间；但当在Linux内部删除文件时，WSL2并不会自动将释放的空间归还给Windows，而是保留在VHDX内部作为“稀疏空间”。  
**解决方案**：

1. **定期清理**：在Docker中运行 docker system prune \-a 清理未使用的镜像和层。  
2. **手动压缩（Diskpart）**：这是唯一释放Windows物理空间的办法。  
   PowerShell  
   \# 在PowerShell（管理员）中执行  
   wsl \-\-shutdown  
   diskpart  
   \# 在Diskpart交互界面中：  
   select vdisk file="C:\\Users\\\<用户名\>\\AppData\\Local\\Docker\\wsl\\data\\ext4.vhdx"  
   compact vdisk

3. **迁移存储路径**：如果不希望占用C盘，可以导出WSL2发行版并导入到其他盘符，或者在Docker Desktop设置中更改镜像存储位置 22。

### **4.3 内存泄漏与系统卡顿：Vmmem进程失控**

**故障现象**：Windows宿主机变得极度卡顿，任务管理器显示名为Vmmem的进程占用了90%以上的内存（例如32GB内存中占用了28GB）。

深度根因分析：  
Linux内核的设计哲学是“空闲内存即浪费”，它会尽可能多地将空闲内存用于页面缓存（Page Cache）以加速文件IO。WSL2作为一个虚拟机，继承了这一特性。如果不加限制，Linux内核会不断吞噬Windows的空闲内存用于缓存模型权重文件，且释放机制不如Windows原生应用灵敏 9。  
解决方案：配置.wslconfig文件限制边界。  
在 C:\\Users\\\<用户名\>\\ 目录下创建 .wslconfig 文件：

Ini, TOML

\[wsl2\]  
memory\=24GB  \# 强制限制WSL2最大内存使用量  
swap\=8GB     \# 设置交换空间，防止OOM崩溃  
processors\=8 \# 限制CPU核心数（可选）

*专家建议*：对于运行32B参数模型的系统，建议至少分配24GB内存给WSL2。如果设置得太低（如8GB），模型加载时会频繁触发Swap交换，导致推理速度从“秒回”变成“字回”，严重影响体验 8。

### **4.4 权限噩梦：Permission Denied**

**故障现象**：容器启动失败，日志提示无法创建目录或访问/var/run/docker.sock。

**解决方案**：

* **Linux用户**：确保当前用户已加入docker组：sudo usermod \-aG docker $USER，并在修改后注销重登。  
* **Windows/WSL2用户**：尽量避免将Docker Volume挂载到Windows文件系统路径（如/mnt/c/Users/...）。Windows与Linux的文件权限模型（NTFS vs ext4）不兼容，极易导致数据库锁定或权限错误。请始终使用Docker管理的Volume（如-v open-webui:/app/data）或WSL2内部路径 13。

### **4.5 模型上下文导致的OOM（显存溢出）**

**故障现象**：Qwen 2.5 Coder 32B在刚开始对话时很流畅，但在输入长代码段或多轮对话后，Ollama进程突然崩溃，错误码137（OOM Kill）。

深度根因分析：  
大模型的显存占用由两部分组成：静态权重（Weights）和动态KV缓存（KV Cache）。

* **权重**：Qwen 2.5 Coder 32B Q4量化版本约占用19-20GB显存。  
* KV缓存：随着上下文长度（Context Length）的增加，KV缓存呈线性（甚至在某些注意力机制下呈二次方）增长。对于32k的上下文，全精度的KV缓存可能额外需要4-6GB显存。  
  当总显存需求（20GB \+ 6GB）超过物理显存（如RTX 3090/4090的24GB）时，如果系统内存交换带宽不足，进程就会被杀掉 27。

**解决方案**：

1. **限制上下文**：在Ollama中显式设置上下文窗口上限。虽然模型支持128k，但家用显卡通常跑不满。  
   Bash  
   ollama run qwen2.5-coder:32b /set parameter num\_ctx 16384

2. **KV Cache量化**：Ollama新版本支持KV Cache的FP8或Q4量化，这可以显著减少长文本下的显存占用，但可能会轻微影响召回准确率 30。

## ---

**5\. 核心模型深度评测：Qwen 2.5 Coder**

作为本次部署的核心目标，**Qwen 2.5 Coder**（通义千问代码版）在2025年至2026年初的开源社区中确立了“最强本地编程助手”的地位。

### **5.1 架构与技术规格**

* **模型类型**：Dense（稠密）模型。与混合专家（MoE）架构不同，Qwen 2.5 Coder的320亿参数在每次Token生成时都会被激活。这保证了推理的稳定性，但对算力要求较高 32。  
* **训练数据**：基于Qwen 2.5基座，使用了5.5万亿（5.5T）Tokens的高质量代码、数学和合成数据进行持续预训练。其一大特点是\*\*代码与自然语言的对齐（Grounding）\*\*能力极强，即它不仅能写代码，还能很好地解释代码逻辑 33。  
* **上下文支持**：原生支持128k上下文，这对于分析整个项目仓库（Repo-level reasoning）至关重要。

### **5.2 社区评价与竞品对比**

#### **Qwen 2.5 Coder 32B vs. DeepSeek V3/R1**

DeepSeek R1（2025年1月发布）引入了强化学习驱动的“推理链（Chain of Thought）”能力，使其在**逻辑谜题**和**纯数学证明**上超越了Qwen。然而，在**纯工程代码生成**领域，许多资深开发者认为Qwen 2.5 Coder 32B依然具有优势：

* **稳定性**：Qwen生成的代码往往更符合Python/JS的惯用语法（Idiomatic），而DeepSeek有时会为了展示推理过程而产生冗余输出 34。  
* **指令遵循**：在遵循复杂的输出格式（如特定的JSON结构或API规范）方面，Qwen 2.5 Coder的表现被认为比DeepSeek R1更加鲁棒 34。  
* **资源效率**：DeepSeek V3完整版参数量高达671B，本地无法运行。虽然有蒸馏版本（Distilled），但Qwen 2.5 Coder 32B作为一个原生训练的中型模型，在24GB显存显卡（RTX 3090/4090）上达到了完美的性能/成本平衡点 37。

#### **Qwen 2.5 Coder vs. Llama 3.3 70B**

Llama 3.3 70B是通用的旗舰模型，知识面更广。但在**编程专精**任务上，32B参数的Qwen往往能击败70B的Llama。这验证了“领域专精模型（Domain Specific Model）”在特定任务上的效率优势——用更少的显存实现更好的代码生成效果 38。

## ---

**6\. Ollama模型生态全景（截止2026年1月）**

2026年的开源模型生态呈现出爆炸式增长，模型不仅在参数量上分化，更在功能（多模态、推理、通用）上高度专业化。下表根据Ollama Library的数据，系统性梳理了当前可用的主流大模型及其适用场景。

### **6.1 代码专精类（Coding Specialists）**

这类模型针对编程语言进行了过度训练，适合配合VS Code插件（如Continue）使用。

| 模型名称 | 参数规格 | 显存需求 (Q4量化) | 上下文窗口 | 特性评价 |
| :---- | :---- | :---- | :---- | :---- |
| **Qwen 2.5 Coder** | 0.5B, 1.5B, 3B, 7B, 14B, **32B** | 32B ≈ 19GB | 128k | **当前综合最强**。14B版本适合12GB显存显卡，32B版本适合24GB显卡。代码逻辑严密，多语言支持极佳 33。 |
| **DeepSeek-R1-Distill** | 1.5B, 7B, 14B, 32B | 32B ≈ 20GB | 128k | **最强逻辑推理**。基于Qwen 2.5蒸馏，注入了DeepSeek R1的推理链能力。适合解决极难的算法题，但日常代码补全速度稍慢 41。 |
| **Qwen 3 Coder** | 30B (MoE), 480B | 30B ≈ 19GB | 256k | **下一代架构**。30B版本为混合专家模型，激活参数少，推理速度快，但显存占用依然取决于总参数量 43。 |
| **StarCoder2** | 3B, 7B, 15B | 15B ≈ 9GB | 16k | 专注于稀有编程语言和企业级代码补全，上下文较短，适合作为IDE补全插件 44。 |

### **6.2 通用与推理类（General Purpose & Reasoning）**

| 模型名称 | 参数规格 | 显存需求 (Q4量化) | 关键特性 |
| :---- | :---- | :---- | :---- |
| **Llama 4** | 109B, 400B, 16x17B (MoE) | 109B ≈ 65GB | **Meta最新力作（2025.04发布）**。原生多模态支持。109B版本需要多卡互联（如双3090/4090 NVLink）才能运行 45。 |
| **Llama 3.3** | 70B | ≈ 40GB | 2025年的中流砥柱，性能极其均衡，兼容性最好。适合双卡用户 45。 |
| **Phi 4** | 14B | ≈ 8GB | **微软的高效能模型**。在极小的参数量下实现了惊人的推理能力，是8GB-12GB显存用户的首选 45。 |
| **Mistral Large** | 123B | ≈ 72GB | 欧洲顶级模型，擅长多语言处理和长文本逻辑 45。 |

### **6.3 多模态与边缘端（Multimodal & Edge）**

| 模型名称 | 参数规格 | 特性描述 |
| :---- | :---- | :---- |
| **Gemma 3** | 1B, 4B, 12B, 27B | **Google 2025.08发布**。原生支持图像输入（Vision），不再需要独立的Vision Encoder。27B版本在多模态理解上表现优异 47。 |
| **Qwen 3 VL** | 2B, 8B, 30B | 视觉理解能力极强，能精准识别图表、UI界面和手写文字 49。 |
| **Nemotron-3 Nano** | Nano | 极小模型，专为Agent调度和快速函数调用设计，速度极快 49。 |

### **6.4 关于DeepSeek V3的特别说明**

需要特别指出的是，**DeepSeek V3** 作为一个671B参数的巨型MoE模型，**并不适合**在单台甚至常见的双卡PC上运行。即使是Q4量化版本也需要近400GB的显存/内存。Ollama库中常见的“DeepSeek V3”通常是指其API接入版本（需联网）或者是基于其蒸馏的小参数版本（如DeepSeek-R1-Distill-Llama-70B）。用户在下载时应仔细甄别模型参数量，避免下载数百GB后无法运行的尴尬 44。

## ---

**7\. 进阶配置：Open WebUI的高级玩法**

部署完成后，通过Open WebUI的高级功能，可以将本地LLM升级为生产力工具。

### **7.1 本地RAG（知识库）搭建**

RAG允许模型“外挂”私有知识。Open WebUI内置了基于ChromaDB的向量数据库，无需额外配置即可使用。

1. **嵌入模型（Embedding Model）**：首次使用知识库时，Open WebUI会自动下载轻量级嵌入模型（如all-MiniLM-L6-v2）。  
2. **上传文档**：在“Workspace” \-\> “Knowledge”中上传PDF、TXT或Markdown文档。系统会自动切片并向量化。  
3. **调用方法**：在对话框中输入\#号，即可选择已创建的知识集合。此时，模型将基于文档内容回答问题，显著减少幻觉 52。

### **7.2 联网搜索与Agent能力**

Open WebUI支持接入SearXNG或Google Custom Search API。配置后，模型在遇到无法回答的时事问题时，会自动触发联网搜索工具，通过阅读搜索结果来合成答案。这使得Qwen 2.5 Coder不仅是编程助手，还能成为类似Perplexity的智能搜索引擎。

## ---

**8\. 结论与展望**

在2026年的时间节点上，PC端本地AI部署已经形成了一套成熟的方法论。

* **硬件层面**，24GB显存（如RTX 3090/4090）成为了运行高性能代码模型（32B参数）的黄金标准线。  
* **软件层面**，Docker \+ Ollama \+ Open WebUI的组合拳极大地降低了部署门槛，但WSL2的内存机制和Docker的网络隔离特性依然是新手最容易“踩坑”的区域。  
* **模型层面**，Qwen 2.5 Coder凭借其Dense架构的稳定性和卓越的代码能力，在面对DeepSeek R1等推理模型和Llama 4等多模态模型的夹击下，依然守住了“最强本地编程模型”的阵地。

通过遵循本报告提供的部署规范与避坑指南，用户完全有能力在个人PC上构建出一套隐私安全、响应迅速且能力强大的AI工作流，摆脱对云端API的依赖，真正实现AI算力的民主化。

## ---

**9\. 附录：常用维护指令速查表**

为了方便日常运维，以下列出高频使用的管理指令：

| 任务目标 | 命令行指令 / 操作 |
| :---- | :---- |
| **更新Ollama内核** | docker pull ollama/ollama:latest 然后删除旧容器并重新运行启动命令 |
| **监控GPU实时状态** | docker exec \-it ollama nvidia-smi (Linux/WSL2) |
| **强制释放显存** | 调用API：curl http://localhost:11434/api/generate \-d '{"model": "qwen2.5-coder:32b", "keep\_alive": 0}' |
| **调整上下文窗口** | ollama run qwen2.5-coder:32b /set parameter num\_ctx 32768 |
| **查看容器错误日志** | docker logs \-f \--tail 100 open-webui |
| **清理Docker垃圾** | docker system prune \-a (慎用：会删除未运行容器的镜像) |

***报告结束***

#### **引用的著作**

1. Best Ollama Models 2025: Complete Performance Guide \- Collabnix, 访问时间为 一月 7, 2026， [https://collabnix.com/best-ollama-models-in-2025-complete-performance-comparison/](https://collabnix.com/best-ollama-models-in-2025-complete-performance-comparison/)  
2. Open-Source AI Tool Upgrades Speed Up LLM and Diffusion Models on NVIDIA RTX PCs, 访问时间为 一月 7, 2026， [https://developer.nvidia.com/blog/open-source-ai-tool-upgrades-speed-up-llm-and-diffusion-models-on-nvidia-rtx-pcs/](https://developer.nvidia.com/blog/open-source-ai-tool-upgrades-speed-up-llm-and-diffusion-models-on-nvidia-rtx-pcs/)  
3. Top 5 Local LLM Tools and Models in 2025 \- Pinggy, 访问时间为 一月 7, 2026， [https://pinggy.io/blog/top\_5\_local\_llm\_tools\_and\_models\_2025/](https://pinggy.io/blog/top_5_local_llm_tools_and_models_2025/)  
4. Docker \- Ollama's documentation, 访问时间为 一月 7, 2026， [https://docs.ollama.com/docker](https://docs.ollama.com/docker)  
5. Ollama with Open Web UI and Nvidia GPU Support on rootless Docker \- Medium, 访问时间为 一月 7, 2026， [https://medium.com/elevate-tech/ollama-with-open-web-ui-and-nvidia-gpu-support-on-rootless-docker-4748b483580a](https://medium.com/elevate-tech/ollama-with-open-web-ui-and-nvidia-gpu-support-on-rootless-docker-4748b483580a)  
6. Tutorial: Run LLMs using AMD GPU and ROCm in unprivileged LXC container, 访问时间为 一月 7, 2026， [https://forum.proxmox.com/threads/tutorial-run-llms-using-amd-gpu-and-rocm-in-unprivileged-lxc-container.157920/](https://forum.proxmox.com/threads/tutorial-run-llms-using-amd-gpu-and-rocm-in-unprivileged-lxc-container.157920/)  
7. How I got Ollama to use my GPU in Docker & WSL2 (RTX 3090TI) \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/ollama/comments/1m8cjcj/how\_i\_got\_ollama\_to\_use\_my\_gpu\_in\_docker\_wsl2\_rtx/](https://www.reddit.com/r/ollama/comments/1m8cjcj/how_i_got_ollama_to_use_my_gpu_in_docker_wsl2_rtx/)  
8. WSL2 \+ Docker causes severe memory leaks in vmmem process, consuming all my machine's physical memory · Issue \#8725 · microsoft/WSL \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/microsoft/WSL/issues/8725](https://github.com/microsoft/WSL/issues/8725)  
9. Docker Desktop eats RAM past WSL limit set in .wslconfig file, 访问时间为 一月 7, 2026， [https://forums.docker.com/t/docker-desktop-eats-ram-past-wsl-limit-set-in-wslconfig-file/128150](https://forums.docker.com/t/docker-desktop-eats-ram-past-wsl-limit-set-in-wslconfig-file/128150)  
10. Troubleshooting \- Ollama's documentation, 访问时间为 一月 7, 2026， [https://docs.ollama.com/troubleshooting](https://docs.ollama.com/troubleshooting)  
11. Build a Home Lab for Local LLMs with Docker \+ AMD iGPU \- Coffee Journeys, 访问时间为 一月 7, 2026， [https://coffeejourneys.blog/home-lab-local-llms-docker-amd/](https://coffeejourneys.blog/home-lab-local-llms-docker-amd/)  
12. Running ollama laptop with NVIDIA GPU, within WSL2, using docker \- piers.rocks, 访问时间为 一月 7, 2026， [https://piers.rocks/2024/02/25/ollama-wsl2-nvidia-docker.html](https://piers.rocks/2024/02/25/ollama-wsl2-nvidia-docker.html)  
13. Error while creating mount source path after docker desktop update to v4.35, 访问时间为 一月 7, 2026， [https://forums.docker.com/t/error-while-creating-mount-source-path-after-docker-desktop-update-to-v4-35/144676](https://forums.docker.com/t/error-while-creating-mount-source-path-after-docker-desktop-update-to-v4-35/144676)  
14. Question: How to keep ollama from unloading model out of memory \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/ollama/comments/1fh040f/question\_how\_to\_keep\_ollama\_from\_unloading\_model/](https://www.reddit.com/r/ollama/comments/1fh040f/question_how_to_keep_ollama_from_unloading_model/)  
15. Ollama model keep in memory and prevent unloading between requests (keep\_alive?), 访问时间为 一月 7, 2026， [https://stackoverflow.com/questions/79526074/ollama-model-keep-in-memory-and-prevent-unloading-between-requests-keep-alive](https://stackoverflow.com/questions/79526074/ollama-model-keep-in-memory-and-prevent-unloading-between-requests-keep-alive)  
16. Open WebUI: Home, 访问时间为 一月 7, 2026， [https://docs.openwebui.com/](https://docs.openwebui.com/)  
17. open-webui/open-webui: User-friendly AI Interface (Supports Ollama, OpenAI API, ...) \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/open-webui/open-webui](https://github.com/open-webui/open-webui)  
18. Docker openwebui not able to access host ollama \[closed\] \- Stack Overflow, 访问时间为 一月 7, 2026， [https://stackoverflow.com/questions/78568103/docker-openwebui-not-able-to-access-host-ollama](https://stackoverflow.com/questions/78568103/docker-openwebui-not-able-to-access-host-ollama)  
19. General Help \- AnythingLLM Docs, 访问时间为 一月 7, 2026， [https://docs.useanything.com/ollama-connection-troubleshooting](https://docs.useanything.com/ollama-connection-troubleshooting)  
20. Quick Start \- Open WebUI, 访问时间为 一月 7, 2026， [https://docs.openwebui.com/getting-started/quick-start/](https://docs.openwebui.com/getting-started/quick-start/)  
21. Unable to connect to Ollama · open-webui open-webui · Discussion \#2849 \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/open-webui/open-webui/discussions/2849](https://github.com/open-webui/open-webui/discussions/2849)  
22. Release notes \- Docker Docs, 访问时间为 一月 7, 2026， [https://docs.docker.com/desktop/release-notes/](https://docs.docker.com/desktop/release-notes/)  
23. wslconfig not applied for WSL2 \- Super User, 访问时间为 一月 7, 2026， [https://superuser.com/questions/1632543/wslconfig-not-applied-for-wsl2](https://superuser.com/questions/1632543/wslconfig-not-applied-for-wsl2)  
24. Memory allocation to docker containers after moving to WSL 2 in Windows \- Stack Overflow, 访问时间为 一月 7, 2026， [https://stackoverflow.com/questions/62405765/memory-allocation-to-docker-containers-after-moving-to-wsl-2-in-windows](https://stackoverflow.com/questions/62405765/memory-allocation-to-docker-containers-after-moving-to-wsl-2-in-windows)  
25. Docker \- PhotoPrism, 访问时间为 一月 7, 2026， [https://docs.photoprism.app/getting-started/troubleshooting/docker/](https://docs.photoprism.app/getting-started/troubleshooting/docker/)  
26. Service Installations Seem to Have File Issues · microsoft WSL · Discussion \#12123 \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/microsoft/WSL/discussions/12123](https://github.com/microsoft/WSL/discussions/12123)  
27. Qwen/Qwen2.5-Coder-32B-Instruct · Requesting information about hardware resources, 访问时间为 一月 7, 2026， [https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct/discussions/28](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct/discussions/28)  
28. Comment your qwen coder 2.5 setup t/s here : r/LocalLLaMA \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1gxs34g/comment\_your\_qwen\_coder\_25\_setup\_ts\_here/](https://www.reddit.com/r/LocalLLaMA/comments/1gxs34g/comment_your_qwen_coder_25_setup_ts_here/)  
29. How Much VRAM Do you need to run a 32B with 32k context? : r/LocalLLaMA \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1j5kdcm/how\_much\_vram\_do\_you\_need\_to\_run\_a\_32b\_with\_32k/](https://www.reddit.com/r/LocalLLaMA/comments/1j5kdcm/how_much_vram_do_you_need_to_run_a_32b_with_32k/)  
30. QwQ 32B Preview: Q4\_K\_M better than Q8\_0 at coding · Issue \#8004 \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/ollama/ollama/issues/8004](https://github.com/ollama/ollama/issues/8004)  
31. Context Kills VRAM: How to Run LLMs on consumer GPUs | by Lyx | Medium, 访问时间为 一月 7, 2026， [https://medium.com/@lyx\_62906/context-kills-vram-how-to-run-llms-on-consumer-gpus-a785e8035632](https://medium.com/@lyx_62906/context-kills-vram-how-to-run-llms-on-consumer-gpus-a785e8035632)  
32. qwen2.5 \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/qwen2.5](https://ollama.com/library/qwen2.5)  
33. Qwen/Qwen2.5-Coder-32B-Instruct \- Hugging Face, 访问时间为 一月 7, 2026， [https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct)  
34. Qwen 3 thinks deeper, acts faster, and it outperforms models like DeepSeek-R1, Grok 3 and Gemini-2.5-Pro. \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1mbbphk/qwen\_3\_thinks\_deeper\_acts\_faster\_and\_it/](https://www.reddit.com/r/LocalLLaMA/comments/1mbbphk/qwen_3_thinks_deeper_acts_faster_and_it/)  
35. DeepSeek V3.1 vs. Qwen3-Coder: Which is better for coding? : r/CLine \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/CLine/comments/1my6nb1/deepseek\_v31\_vs\_qwen3coder\_which\_is\_better\_for/](https://www.reddit.com/r/CLine/comments/1my6nb1/deepseek_v31_vs_qwen3coder_which_is_better_for/)  
36. deepseek r1 vs qwen 3 coder vs glm 4.5 vs kimi k2 : r/LocalLLM \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLM/comments/1n32n02/deepseek\_r1\_vs\_qwen\_3\_coder\_vs\_glm\_45\_vs\_kimi\_k2/](https://www.reddit.com/r/LocalLLM/comments/1n32n02/deepseek_r1_vs_qwen_3_coder_vs_glm_45_vs_kimi_k2/)  
37. Do you guys personally notice a difference between Q4 \- Q8 or higher? : r/LocalLLaMA, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1o5mr9j/do\_you\_guys\_personally\_notice\_a\_difference/](https://www.reddit.com/r/LocalLLaMA/comments/1o5mr9j/do_you_guys_personally_notice_a_difference/)  
38. Deepseek V3 benchmarks are a reminder that Qwen 2.5 72B is the real king and everyone else is joking\! \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1hmqpca/deepseek\_v3\_benchmarks\_are\_a\_reminder\_that\_qwen/](https://www.reddit.com/r/LocalLLaMA/comments/1hmqpca/deepseek_v3_benchmarks_are_a_reminder_that_qwen/)  
39. Qwen-2.5-Coder 32B – The AI That's Revolutionizing Coding\! \- Real God in a Box? \- Reddit, 访问时间为 一月 7, 2026， [https://www.reddit.com/r/LocalLLaMA/comments/1gp84in/qwen25coder\_32b\_the\_ai\_thats\_revolutionizing/](https://www.reddit.com/r/LocalLLaMA/comments/1gp84in/qwen25coder_32b_the_ai_thats_revolutionizing/)  
40. qwen2.5-coder:32b-base-q4\_K\_M \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/qwen2.5-coder:32b-base-q4\_K\_M](https://ollama.com/library/qwen2.5-coder:32b-base-q4_K_M)  
41. deepseek-r1:32b \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/deepseek-r1:32b](https://ollama.com/library/deepseek-r1:32b)  
42. deepseek-ai/DeepSeek-R1-Distill-Qwen-32B \- Hugging Face, 访问时间为 一月 7, 2026， [https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B)  
43. qwen3-coder \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/qwen3-coder](https://ollama.com/library/qwen3-coder)  
44. The 11 best open-source LLMs for 2025 \- n8n Blog, 访问时间为 一月 7, 2026， [https://blog.n8n.io/open-source-llm/](https://blog.n8n.io/open-source-llm/)  
45. ollama/ollama: Get up and running with OpenAI gpt-oss, DeepSeek-R1, Gemma 3 and other models. \- GitHub, 访问时间为 一月 7, 2026， [https://github.com/ollama/ollama](https://github.com/ollama/ollama)  
46. llama4 \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/llama4](https://ollama.com/library/llama4)  
47. gemma3 \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/gemma3](https://ollama.com/library/gemma3)  
48. Welcome Gemma 3: Google's all new multimodal, multilingual, long context open LLM, 访问时间为 一月 7, 2026， [https://huggingface.co/blog/gemma3](https://huggingface.co/blog/gemma3)  
49. library \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library](https://ollama.com/library)  
50. deepseek-v3 \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/deepseek-v3](https://ollama.com/library/deepseek-v3)  
51. deepseek-r1 \- Ollama, 访问时间为 一月 7, 2026， [https://ollama.com/library/deepseek-r1](https://ollama.com/library/deepseek-r1)  
52. Open WebUI RAG Tutorial, 访问时间为 一月 7, 2026， [https://docs.openwebui.com/tutorials/tips/rag-tutorial/](https://docs.openwebui.com/tutorials/tips/rag-tutorial/)

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/ollama-qwen2.5-docker-%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97/  


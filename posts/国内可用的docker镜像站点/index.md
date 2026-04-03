# 国内可用的docker镜像站点


最近在折腾服务器，Docker Hub官方仓库经常连不上，拉取超时、报错 `i/o timeout` 等问题，我搜集了一下国内可用的地址，截至2026 年 1 月最新实测可用。这里留一份备查。
<!--more-->

---

## 01 镜像拉取超时的 3 个核心原因

1. **跨国网络与带宽限制**：Docker Hub 官方仓库在海外，受国际带宽和路由跳转影响，极易出现 `dial tcp ... i/o timeout`。
2. **政策与安全管控要求**：基于《数据安全法》等合规要求，跨境数据流动受限。同时为防范“容器逃逸”等漏洞，监管对境外镜像访问有严格限制。
3. **技术依赖与供应链风险**：受国际局势影响，海外官方源稳定性下降，国内正推动信创产业自主可控。

**结论**：直接走官方通道很困难，必须使用国内镜像加速器（高速直达通道）。

---

## 02 最新 Docker 镜像加速地址 (2026年1月验证)

建议在配置中**同时添加 5 个以上**地址，系统会按顺序尝试访问。

| 推荐优先级 | 加速地址 URL |
| :--- | :--- |
| **优选 1** | `https://docker.1ms.run` |
| **优选 2** | `https://docker.kejilion.pro` |
| **优选 3** | `https://docker-registry.nmqu.com` |
| **备选集** | `https://docker.xuanyuan.me` |
| | `https://dockerproxy.net` |
| | `https://hub.rat.dev` |
| | `https://hub1.nat.tf` |
| | `https://hub2.nat.tf` |
| | `https://hub3.nat.tf` |
| | `https://hub4.nat.tf` |
| | `https://mirror.iscas.ac.cn` |
| | `https://docker-0.unsee.tech` |
| | `https://docker.apiba.cn` |
| | `https://docker.m.daocloud.io` |
| | `https://docker.hpcloud.cloud` |

---

## 03 群晖 NAS 添加加速地址教程

1. **打开应用**：进入群晖 `Container Manager` (原 Docker)。
2. **进入设置**：点击左侧 `镜像仓库` -> 选中 `Docker Hub` -> 点击上方 `设置`。
3. **编辑注册表**：在 `Docker Hub (v1)` 处点击 `编辑`。
4. **启用加速**：勾选“启用注册表镜像”，将上述 URL 粘贴进去。
   > **注意**：修改镜像仓库 URL 会导致 Docker 服务重启，请确保当前没有重要的容器任务在运行。

---

## 04 飞牛 NAS 添加加速地址教程

1. **进入 Docker**：打开飞牛系统的 `Docker` 应用。
2. **镜像设置**：点击 `镜像仓库` -> `设置` -> `加速源设置`。
3. **保存配置**：添加需要的加速地址，点击“保存并重启 Docker”。

---

## 05 Linux通用方法

### 方法1：修改 Docker 配置文件源码 (`/etc/docker/daemon.json`)

直接复制下面的代码块，然后将其保存为 `/etc/docker/daemon.json`。

```json
{
  "registry-mirrors": [
    "[https://docker.1ms.run](https://docker.1ms.run)",
    "[https://docker.kejilion.pro](https://docker.kejilion.pro)",
    "[https://docker-registry.nmqu.com](https://docker-registry.nmqu.com)",
    "[https://docker.xuanyuan.me](https://docker.xuanyuan.me)",
    "[https://dockerproxy.net](https://dockerproxy.net)",
    "[https://hub.rat.dev](https://hub.rat.dev)",
    "[https://hub1.nat.tf](https://hub1.nat.tf)",
    "[https://hub2.nat.tf](https://hub2.nat.tf)",
    "[https://hub3.nat.tf](https://hub3.nat.tf)",
    "[https://hub4.nat.tf](https://hub4.nat.tf)",
    "[https://mirror.iscas.ac.cn](https://mirror.iscas.ac.cn)",
    "[https://docker-0.unsee.tech](https://docker-0.unsee.tech)",
    "[https://docker.apiba.cn](https://docker.apiba.cn)",
    "[https://docker.m.daocloud.io](https://docker.m.daocloud.io)",
    "[https://docker.hpcloud.cloud](https://docker.hpcloud.cloud)"
  ]
}
```
### 方法2 直接使用命令写入配置
```bash
# SSH执行下列命令
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "[https://docker.1ms.run](https://docker.1ms.run)",
    "[https://docker.kejilion.pro](https://docker.kejilion.pro)",
    "[https://docker-registry.nmqu.com](https://docker-registry.nmqu.com)",
    "[https://docker.xuanyuan.me](https://docker.xuanyuan.me)",
    "[https://dockerproxy.net](https://dockerproxy.net)",
    "[https://hub.rat.dev](https://hub.rat.dev)",
    "[https://hub1.nat.tf](https://hub1.nat.tf)",
    "[https://hub2.nat.tf](https://hub2.nat.tf)",
    "[https://hub3.nat.tf](https://hub3.nat.tf)",
    "[https://hub4.nat.tf](https://hub4.nat.tf)",
    "[https://mirror.iscas.ac.cn](https://mirror.iscas.ac.cn)",
    "[https://docker-0.unsee.tech](https://docker-0.unsee.tech)",
    "[https://docker.apiba.cn](https://docker.apiba.cn)",
    "[https://docker.m.daocloud.io](https://docker.m.daocloud.io)",
    "[https://docker.hpcloud.cloud](https://docker.hpcloud.cloud)"
  ]
}
EOF
# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```
## 06 通用验证方法（全平台适用）

配置完成后，请务必验证是否生效：

1. **检查配置列表**：
   打开 SSH 工具，输入：
   ```bash
   docker info
   ```
   在输出结果中找到 Registry Mirrors 字段，确认显示了你配置的地址。

   测试拉取速度： 尝试拉取一个标准镜像测试带宽：

   ```Bash
   docker pull ubuntu:20.04
   ```
   若速度达到几 MB/s，说明配置成功。

国内镜像源可能随政策调整失效，感谢大神制作的下面的监测网页，*~~可读性很差，就是我最无语的CSS特效限时免费的那种网站。~~*

https://docker.aabcc.top/status/docker-images

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/%E5%9B%BD%E5%86%85%E5%8F%AF%E7%94%A8%E7%9A%84docker%E9%95%9C%E5%83%8F%E7%AB%99%E7%82%B9/  


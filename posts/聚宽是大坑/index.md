# 还是使用docker折腾聚宽吧


前文说到我用了[虚拟环境搭建jupyter跑聚宽API]({{< relref "学习聚宽ing" >}})，但是聚宽对各种库的版本限制太死板了，而且有的版本还很低，折腾来折腾去，只好用docker一劳永逸了。
## 准备工作
1. ### 给 pip 换成国内源
   推荐清华源或阿里云源，能极大地提升安装速度，尤其是像 matplotlib 这种较大的包。

    目前是以 root 身份在 ```/opt/jupyterlab``` 下操作，直接修改全局配置。

    自动配置方案（最快）

    在终端直接运行下面这行命令，它会自动创建配置文件并写入清华大学的镜像源：

    ```Bash
    pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
    ```
2. ### 停止Jupyter
   这里就显示我们之前用虚拟环境的好处了，库文件卸了装装了卸，但是对系统没有影响，只要删除```/jq_env```文件夹即可。
   既可以清理空间，又能保留之前的折腾：

    #### 清理当前的虚拟环境
     无需一个一个包去 pip uninstall，最干净的做法是直接删除那个文件夹：

    ```Bash
    # 停止当前占用该环境的 Jupyter Kernel (在网页端关闭对应的 Notebook)
    # 然后在终端执行：
    rm -rf /opt/jupyterlab/jq_env
    ```
    这样做的好处是彻底抹除了之前那些冲突的 NumPy 和 Pandas 二进制文件。

    #### 取消 Jupyter 中的残留内核记录
    之前运行了 ```ipykernel install```，如果不清理，Jupyter 的新建菜单里还会残留一个不能用的 Python (JoinQuant) 选项。

    ```Bash
    jupyter kernelspec uninstall jq_env
    ```
    #### 停止并清理宿主机的旧环境
    为了防止端口冲突，停掉之前运行在 /opt/jupyterlab 的原生服务。

    ```Bash
    # 停止宿主机的 Jupyter（如果用 systemctl 启动的）
    systemctl stop jupyterlab 
    #或者如果是后台进程，可以 kill 掉
    pkill -f jupyter
    ```
## 安装Docker
### 国内镜像安装
直接运行以下这一整段命令，它会跳过官方脚本，直接使用国内镜像：

```Bash
# 1. 安装基础依赖
apt-get update
apt-get install -y ca-certificates curl gnupg

# 2. 添加清华源的 Docker 密钥
curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 3. 添加清华源的软件仓库地址
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list

# 4. 再次更新并安装 Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io
```
安装完成后，运行 docker version 确认一下。如果能看到版本号，说明 Docker 已经活了。
### 处理docker镜像
1. 执行以下命令：[从国内镜像站下载docker镜像]({{< relref "国内可用的docker镜像站点" >}})

    ```Bash
    docker pull docker.1ms.run/jupyter/scipy-notebook:python-3.10
    ```
2. 修改标签(可以不做)
   
   拉取成功后，镜像名是```docker.1ms.run/jupyter/scipy-notebook:python-3.10```,我们需要把它“重命名”回官方的名字```jupyter/scipy-notebook:python-3.10```。不然不直观。

    ```Bash
    docker tag docker.1ms.run/jupyter/scipy-notebook:python-3.10 jupyter/scipy-notebook:python-3.10
    ```
1. 启动容器

    直接运行启动命令：

    ```Bash
    # 如果之前的容器名被占用了，先删掉
    docker rm -f jupyter-quant 2>/dev/null

    # 启动容器
    docker run -d \
      --name jupyter-quant \
      --restart always \
      -p 8888:8888 \
      -v /opt/jupyterlab:/home/jovyan/work \
      -e JUPYTER_TOKEN=ABCD \ #把ABCD改成自己的密码
      jupyter/scipy-notebook:python-3.10
      ```
2. 进入容器安装 jqdatasdk
   
    容器启动后，最后一步就是把聚宽的数据接口装进去。注意：容器内部也要换源，否则安装会很慢。

    ```Bash
    # 1. 进入容器
    docker exec -it jupyter-quant bash

    # 2. 容器内换清华源并安装
    pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
    pip install jqdatasdk pandas==1.5.3

    # 3. 验证一下环境
    python -c "import jqdatasdk; import pandas; print('环境 OK:', pandas.__version__)"

    # 4. 退出容器
    exit
    ```
### 收工
端口： 还是 8888。

代码： 全部保留，还是 /opt/jupyterlab 里的那些文件。

稳定性： Python 3.10 + Pandas 1.5.3 的组合，可以完美运行聚宽的所有 API。
此时已经可以跑通JQData本地量化了。

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/%E8%81%9A%E5%AE%BD%E6%98%AF%E5%A4%A7%E5%9D%91/  


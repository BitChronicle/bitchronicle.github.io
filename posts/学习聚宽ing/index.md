# 学习使用聚宽

## 安装jqdatasdk
在当前虚拟环境下安装好 ```jqdatasdk``` 即可。
### 具体命令
直接在 Jupyter 的单元格（Cell）里运行,或者新开一个终端（Terminal）页面，无需SSH连接服务器。

```Bash
#pip前面的 ! 是让 Jupyter 直接执行终端命令。如果是在Terminal里，则不需要感叹号。
!pip install jqdatasdk
```
### 遇到坑了
报错了。提示以下信息：
```bash
root@Jupyter:/opt/jupyterlab# pip install jqdatasdk

error: externally-managed-environment



× This environment is externally managed

╰─> To install Python packages system-wide, try apt install

    python3-xyz, where xyz is the package you are trying to

    install.

    

    If you wish to install a non-Debian-packaged Python package,

    create a virtual environment using python3 -m venv path/to/venv.

    Then use path/to/venv/bin/python and path/to/venv/bin/pip. Make

    sure you have python3-full installed.

    

    If you wish to install a non-Debian packaged Python application,

    it may be easiest to use pipx install xyz, which will manage a

    virtual environment for you. Make sure you have pipx installed.

    

    See /usr/share/doc/python3.12/README.venv for more information.



note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.

hint: See PEP 668 for the detailed specification.

root@Jupyter:/opt/jupyterlab#
```
这是触发了常见的 PEP 668 保护机制。

虽然报错提示可以用 ```--break-system-packages``` 强制安装，但强烈不建议这样做，因为：
- 这可能会污染系统的 Python 环境，导致Jupyter 本身运行出问题。

- 由于之后可能还会安装 Tushare、AKShare 或者 Pandas 的特定版本，还是建议标准的虚拟环境流程。这样可以拥有一个纯净的“环境”，即使以后包版本冲突了，直接删掉 jq_env 文件夹重来就行，不会影响到 /opt/jupyterlab 本身的运行。

### 解决方法
直接按照标准的虚拟环境流程来解决：在 Jupyter 内部创建并关联内核。

如果希望以后在 Jupyter 的下拉菜单里直接选择这个量化专用的环境，按以下步骤操作：

#### 创建虚拟环境：

```Bash
python3 -m venv /opt/jupyterlab/jq_env
```
#### 激活环境并安装 jqdatasdk：

```Bash
source /opt/jupyterlab/jq_env/bin/activate
pip install jqdatasdk ipykernel
```
#### 将该环境注册到 Jupyter：

```Bash
python -m ipykernel install --user --name=jq_env --display-name "Python (JoinQuant)"
```
#### 使用： 
刷新JupyterLab 页面，就会发现新建页面多了一个"Python (JoinQuant)" 选项，选择 "Python (JoinQuant)" 即可。

见图：
![JoinQuant](181902.png)

## 第二个坑
### Pandas 版本太新
Python 3.12默认的Pandas 版本太新了（默认安装的是 Pandas 2.x）。 在 Pandas 2.1.0 之后的版本中，需要降级 Pandas到 1.5.3 版本，据说这是目前与老牌量化库兼容性最好的版本。
### 解决办法
在jupyter终端（Terminal）执行以下命令：

```Bash
# 确保在你的虚拟环境中执行
-source /opt/jupyterlab/jq_env/bin/activate

# 卸载当前高版本 Pandas 并安装兼容版本
pip install pandas==1.5.3
```
安装完成后，务必执行以下一步： 关闭所有的Notebook页面，在 JupyterLab 页面上方菜单栏点击 Kernel -> Restart Kernel... (重启内核)，然后再重新运行 ```import jqdatasdk as jq```。

## 换源
在 Linux 服务器上，给 pip 换成国内源（推荐清华源或阿里云源）能极大地提升安装速度，尤其是像 matplotlib 这种较大的包。

目前是以 root 身份在 ```/opt/jupyterlab``` 下操作，直接修改全局配置。

自动配置方案（最快）
在终端直接运行下面这行命令，它会自动创建配置文件并写入清华大学的镜像源：

```Bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```
顺便测试一下下面这个代码
{{< echarts >}}
{
  "title": { "text": "量化回测：资产净值曲线", "left": "center" },
  "tooltip": { "trigger": "axis" },
  "xAxis": {
    "type": "category",
    "data": ["2026-01-20", "2026-01-25", "2026-02-01", "2026-02-03"]
  },
  "yAxis": { "type": "value", "scale": true },
  "series": [
    {
      "name": "净值",
      "type": "line",
      "data": [1.05, 1.12, 0.85, 0.92],
      "smooth": true,
      "itemStyle": { "color": "#2563eb" },
      "areaStyle": { "opacity": 0.1 }
    }
  ]
}
{{< /echarts >}}


---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/%E5%AD%A6%E4%B9%A0%E8%81%9A%E5%AE%BDing/  


# Rsync使用笔记

## 📖 前言

说实话，Linux 下文件同步的工具不少，但 Rsync 真的是最稳的那个。增量传输、断点续传、压缩传输，该有的功能都有，而且几乎每个 Linux 系统都自带。这篇记录一下我这些年用 Rsync 的经验，从基础用法到异地容灾。
<!--more-->
---

## 一、为什么选 Rsync

### 我试过的其他方案

| 工具 | 优点 | 缺点 | 为什么不用了 |
| :--- | :--- | :--- | :--- |
| **scp** | 简单 | 每次都全量传输，慢 | 数据量大就废了 |
| **ftp** | 图形界面友好 | 不安全，不支持增量 | 早就淘汰了 |
| **rclone** | 支持云存储 | 对本地同步不够灵活 | 云存储场景用 |
| **GUI工具** | 操作简单 | 不稳定，容易断 | 命令行更可靠 |

### Rsync 的优势
* **增量传输**：只传变化的部分，大文件也能秒同步。
* **断点续传**：网络断了能接着传，不用从头来。
* **保持属性**：权限、时间戳、软链接都能保留。
* **几乎零配置**：系统自带，装完就能用。

---

## 二、基础用法（日常高频）

### 1. 本地同步
最常用的命令：
```bash
rsync -avP --delete /source/ /backup/
```

**参数说明：**
* -a：归档模式，保持所有属性（权限、时间、软链接等）。
* -v：显示详细信息。
* -P：显示进度 + 断点续传。
* --delete：删除目标目录里多余的文件（让两边完全一致）。

**⚠️ 关键细节：斜杠的区别**
* ```rsync -av /source/ /target/```：同步 source **目录下**的内容到 target。
* ```rsync -av /source /target/``` ：同步 source **目录本身**到 target（结果是 /target/source/）。

### 2. 排除文件
排除日志、缓存等不需要同步的文件：
```bash
rsync -avP \
  --exclude='*.log' \
  --exclude='cache/' \
  --exclude='node_modules/' \
  /source/ /backup/
  ```

也可以使用文件列表 ```--exclude-from='exclude.txt'```。

### 3. 试运行 (Dry Run)
不确定命令是否正确时，加 -n 参数：
```rsync -avPn /source/ /backup/```

---

## 三、远程同步（SSH 方式）

### 1. 基本命令
# 推送到远程
```rsync -avPz -e ssh /local/data/ user@remote:/remote/backup/```

# 从远程拉取
```rsync -avPz -e ssh user@remote:/remote/data/ /local/backup/```

* ```-z```：压缩传输，省带宽但耗 CPU。内网可不加，外网建议加。

### 2. SSH 密钥配置（免密登录）
# 生成密钥
```ssh-keygen -t ed25519 -f ~/.ssh/backup_key -N ""```
# 复制公钥
```ssh-copy-id -i ~/.ssh/backup_key.pub user@remote```
# Rsync 指定密钥
```rsync -avPz -e "ssh -i ~/.ssh/backup_key" /local/ user@remote:/backup/```

---

## 四、自动化备份脚本实战

### 1. 基础日备脚本
```bash
#!/bin/bash
# backup.sh
SOURCE="/data/important/"
DEST="/backup/daily/"
LOG="/var/log/backup.log"
DATE=$(date +%Y-%m-%d_%H%M)

mkdir -p "$DEST"
echo "[$DATE] 开始备份" >> "$LOG"

rsync -avP --delete \
  --exclude='*.tmp' \
  --exclude='cache/' \
  "$SOURCE" "$DEST" >> "$LOG" 2>&1

if [ $? -eq 0 ]; then
  echo "[$DATE] 备份成功" >> "$LOG"
else
  echo "[$DATE] 备份失败" >> "$LOG"
fi
```
### 2. 增量备份（硬链接黑科技）
利用 ```--link-dest``` 复用未变更文件的空间：
```bash
#!/bin/bash
# incremental_backup.sh
SOURCE="/data/important/"
BACKUP_BASE="/backup"
DATE=$(date +%Y-%m-%d)
LATEST="$BACKUP_BASE/latest"
DEST="$BACKUP_BASE/$DATE"

if [ -d "$LATEST" ]; then
  rsync -avP --delete --link-dest="$LATEST" "$SOURCE" "$DEST"
else
  rsync -avP --delete "$SOURCE" "$DEST"
fi

# 更新 latest 指针
rm -f "$LATEST"
ln -s "$DEST" "$LATEST"
# 清理7天前备份
find "$BACKUP_BASE" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;
```
---

## 四、异地容灾与数据库同步

### 1. 异地容灾脚本（带限速）
结合 VPN/组网工具（如星空组网）打通内网后：
```bash
#!/bin/bash
# disaster_recovery.sh
LOCAL_DATA="/data"
REMOTE_HOST="root@10.26.0.2"  # 异地内网IP
SSH_KEY="/root/.ssh/dr_key"
BANDWIDTH="5000"  # 限速 5MB/s

rsync -avPz --delete \
  --bwlimit="$BANDWIDTH" \
  -e "ssh -i $SSH_KEY" \
  "$LOCAL_DATA" "$REMOTE_HOST:/backup/beijing/" >> /var/log/dr_backup.log 2>&1
```
### 2. 数据库备份同步
**MySQL:** 先 ```mysqldump``` 导出为 .sql.gz，再 Rsync 同步压缩包。
**PostgreSQL:** 使用 ```pg_dumpall | gzip``` 导出，再同步。

---

## 五、 踩坑总结

1.  **权限问题**：保持权限同步通常需要 *root* 或 *sudo*，特别是系统文件备份。
2.  **大文件中断**：加上 ```--partial``` 参数支持断点续传。
3.  **网络超时**：设置 ```--timeout=300``` 或在脚本中增加 while 循环重试机制。

---

## 🚀 六：如何构建 Shell 备份框架

为了便于管理多台服务器和复杂的备份策略，建议将单体脚本升级为**模块化框架**。

### 1. 推荐的目录结构
```Plaintext
backup-framework/
├── config/             # 配置文件
│   ├── hosts.conf      # 远程主机列表 (IP User Port)
│   ├── paths.conf      # 需备份的源目录列表
│   └── exclude.list    # 全局排除文件
├── scripts/            # 逻辑代码
│   ├── lib_log.sh      # 日志函数库
│   ├── lib_alert.sh    # 告警函数库 (钉钉/企业微信)
│   └── core_sync.sh    # 核心 Rsync 封装逻辑
├── logs/               # 运行日志
└── main.sh             # 任务入口
```
### 2. 框架核心逻辑建议 (Error Handling)
在生产环境中，必须处理“静默失败”。

捕获 Rsync 退出码
```bash
rsync -avz ...
RSYNC_CODE=$?

case $RSYNC_CODE in
    0)
        log_info "备份成功"
        ;;
    24)
        log_warn "部分文件在传输期间消失 (通常可忽略)"
        ;;
    *)
        log_error "备份失败，错误码: $RSYNC_CODE"
        send_alert "服务器X备份严重失败，请检查网络！"
        ;;
esac
```
### 3. 初始化全量同步建议
对于异地容灾（如几 TB 数据从北京传上海），不要直接跑脚本。
1.  **物理传输**：先用移动硬盘拷贝数据到异地。
2.  **就地恢复**：在异地服务器释放数据。
3.  **开启增量**：再运行 Rsync 脚本，它会自动通过校验算法仅传输差异部分。

---
*文档生成日期：2026-01-25*

---

> 作者: Mavelsate  
> URL: https://blog.yeliya.site/posts/rsync%E4%BD%BF%E7%94%A8%E7%AC%94%E8%AE%B0/  


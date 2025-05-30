# 数据库管理工具

本目录包含用于管理数据库的各种脚本工具，包括数据库初始化、迁移、备份和恢复等功能。

## 脚本概览

- `init_db.py`: 数据库初始化脚本，用于创建数据库表结构
- `run_migrations.py`: 数据库迁移执行脚本，用于执行Alembic迁移
- `db_backup.py`: 数据库备份和恢复脚本
- `migrate_db.py`: 数据迁移脚本，用于从旧表结构迁移数据到新表结构

## 使用方法

### 数据库初始化

初始化数据库和表结构：

```bash
python scripts/init_db.py --init
```

检查表的列信息：

```bash
python scripts/init_db.py --check
```

手动添加avatar列（如果迁移失败可以使用此方法）：

```bash
python scripts/init_db.py --add-avatar
```

### 数据库迁移

检查迁移状态：

```bash
python scripts/run_migrations.py --check
```

创建新的迁移文件：

```bash
python scripts/run_migrations.py --create "添加头像字段"
```

执行所有待执行的迁移：

```bash
python scripts/run_migrations.py --run
```

### 数据库备份和恢复

备份数据库：

```bash
python scripts/db_backup.py --backup
```

列出所有备份文件：

```bash
python scripts/db_backup.py --list
```

从备份文件恢复数据库：

```bash
python scripts/db_backup.py --restore backups/KorsonStudySystem_20250515_120000.sql
```

清理7天前的旧备份：

```bash
python scripts/db_backup.py --cleanup 7
```

### 数据迁移

将旧表结构的数据迁移到新表结构：

```bash
python scripts/migrate_db.py
```

## 数据库迁移说明

### 添加头像字段迁移

我们已经创建了一个迁移文件 `add_avatar_to_users.py`，用于向用户表添加avatar字段。该迁移文件的内容如下：

```python
def upgrade() -> None:
    """Upgrade schema."""
    # 添加avatar字段到users表
    op.add_column('users', sa.Column('avatar', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # 删除avatar字段
    op.drop_column('users', 'avatar')
```

执行此迁移将向用户表添加一个可为空的Text类型的avatar字段，用于存储DiceBear头像URL。

## 故障排除

### 迁移失败

如果迁移失败，可以尝试以下步骤：

1. 检查迁移状态：
   ```bash
   python scripts/run_migrations.py --check
   ```

2. 如果迁移状态显示有问题，可以尝试手动添加avatar列：
   ```bash
   python scripts/init_db.py --add-avatar
   ```

3. 检查表的列信息，确认avatar列是否已添加：
   ```bash
   python scripts/init_db.py --check
   ```

### 数据库连接问题

如果遇到数据库连接问题，请检查以下内容：

1. 确认PostgreSQL服务正在运行
2. 检查数据库连接信息是否正确（用户名、密码、主机、端口、数据库名）
3. 检查防火墙设置是否允许连接到PostgreSQL服务器

## 定期维护

建议设置以下定期维护任务：

1. 每日备份数据库：
   ```bash
   0 2 * * * cd /opt/StudySystem/newstudytool/backend && python scripts/db_backup.py --backup
   ```

2. 每周清理旧备份：
   ```bash
   0 3 * * 0 cd /opt/StudySystem/newstudytool/backend && python scripts/db_backup.py --cleanup 30
   ```

## 注意事项

- 在执行数据库迁移前，请确保已备份数据库
- 在生产环境中执行迁移时，建议先在测试环境中测试
- 数据库备份文件存储在 `backend/backups` 目录中，请定期将备份文件复制到其他安全位置

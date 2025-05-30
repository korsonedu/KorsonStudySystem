"""Add avatar to users table

Revision ID: add_avatar_to_users
Revises: add_email_to_users
Create Date: 2025-05-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_avatar_to_users'
down_revision: Union[str, None] = 'add_email_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加avatar字段到users表
    op.add_column('common_users', sa.Column('avatar', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # 删除avatar字段
    op.drop_column('common_users', 'avatar')

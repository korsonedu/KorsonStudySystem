"""Add email to users table

Revision ID: add_email_to_users
Revises: 3381f0956f09
Create Date: 2025-04-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_email_to_users'
down_revision: Union[str, None] = '3381f0956f09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加email字段到users表
    op.add_column('common_users', sa.Column('email', sa.String(), nullable=True))

    # 添加唯一性约束
    op.create_index(op.f('ix_common_users_email'), 'common_users', ['email'], unique=True)

    # 添加email_verified字段
    op.add_column('common_users', sa.Column('email_verified', sa.Boolean(), server_default='false', nullable=False))

    # 添加verification_token字段
    op.add_column('common_users', sa.Column('verification_token', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # 删除verification_token字段
    op.drop_column('common_users', 'verification_token')

    # 删除email_verified字段
    op.drop_column('common_users', 'email_verified')

    # 删除唯一性约束
    op.drop_index(op.f('ix_common_users_email'), table_name='common_users')

    # 删除email字段
    op.drop_column('common_users', 'email')

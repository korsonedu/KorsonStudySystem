"""remove_verification_token

Revision ID: d28602e98988
Revises: add_avatar_to_users
Create Date: 2025-05-20 00:00:42.727437

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd28602e98988'
down_revision: Union[str, None] = 'add_avatar_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 移除verification_token字段
    op.drop_column('common_users', 'verification_token')


def downgrade() -> None:
    """Downgrade schema."""
    # 重新添加verification_token字段
    op.add_column('common_users', sa.Column('verification_token', sa.String(), nullable=True))

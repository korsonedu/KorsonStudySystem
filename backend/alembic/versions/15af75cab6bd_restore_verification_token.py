"""restore_verification_token

Revision ID: 15af75cab6bd
Revises: d28602e98988
Create Date: 2025-05-20 00:35:59.980667

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '15af75cab6bd'
down_revision: Union[str, None] = 'd28602e98988'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 重新添加verification_token字段
    op.add_column('common_users', sa.Column('verification_token', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # 移除verification_token字段
    op.drop_column('common_users', 'verification_token')

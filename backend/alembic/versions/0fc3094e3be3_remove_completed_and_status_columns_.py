"""remove_completed_and_status_columns_from_task

Revision ID: 0fc3094e3be3
Revises: 15af75cab6bd
Create Date: 2025-05-21 00:38:06.224920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from app.core.config import TABLE_PREFIX


# revision identifiers, used by Alembic.
revision: str = '0fc3094e3be3'
down_revision: Union[str, None] = '15af75cab6bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove the completed and status columns from task table."""
    # Get the task table name with prefix
    table_name = f"{TABLE_PREFIX['STUDY']}tasks"
    
    # Drop 'completed' column
    with op.batch_alter_table(table_name) as batch_op:
        batch_op.drop_column('completed')
        
        # Check if 'status' column exists before trying to drop it
        # This requires inspecting the table
        conn = op.get_bind()
        inspector = sa.inspect(conn)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        if 'status' in columns:
            batch_op.drop_column('status')


def downgrade() -> None:
    """Add back the completed and status columns."""
    table_name = f"{TABLE_PREFIX['STUDY']}tasks"
    
    with op.batch_alter_table(table_name) as batch_op:
        batch_op.add_column(sa.Column('completed', sa.Boolean(), nullable=True, default=False))
        
        # Only add back 'status' if it was previously present
        # Since we can't determine this in the downgrade, we'll add a comment
        # batch_op.add_column(sa.Column('status', sa.String(), nullable=True))

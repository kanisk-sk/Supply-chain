"""Add optional profile photo to users."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import MEDIUMTEXT

revision = "a60206f1c001"
down_revision = "7d2e9a41c5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("avatar_data", sa.Text().with_variant(MEDIUMTEXT(), "mysql"), nullable=True))


def downgrade():
    op.drop_column("users", "avatar_data")

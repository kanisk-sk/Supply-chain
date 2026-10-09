"""Add shared login/public-tracking request limits.

Revision ID: b73094c2e801
Revises: a60206f1c001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import DATETIME

revision = "b73094c2e801"
down_revision = "a60206f1c001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "request_rate_limits",
        sa.Column("key", sa.String(64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("expires_at", DATETIME(fsp=6), nullable=False),
        sa.PrimaryKeyConstraint("key", name="pk_request_rate_limits"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_request_rate_limits_expires_at", "request_rate_limits", ["expires_at"])


def downgrade():
    op.drop_table("request_rate_limits")

"""
Legacy UserSettings compatibility helpers for seed commands.
"""

from django.db import connection


LEGACY_WIDGET_SIZES_COLUMN = "homepage_widget_sizes"


def _table_columns(table_name):
    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(cursor, table_name)
    return {column.name for column in description}

def _apply_legacy_column_fix(table_name):
    alter_sql = f'ALTER TABLE "{table_name}" ALTER COLUMN "{LEGACY_WIDGET_SIZES_COLUMN}" SET DEFAULT \'{{}}\'::jsonb;'
    update_sql = f'UPDATE "{table_name}" SET "{LEGACY_WIDGET_SIZES_COLUMN}" = \'{{}}\'::jsonb WHERE "{LEGACY_WIDGET_SIZES_COLUMN}" IS NULL;'
    with connection.cursor() as cursor:
        cursor.execute(alter_sql)
        cursor.execute(update_sql)

def ensure_usersettings_seed_compatibility(table_name):
    """Apply the legacy widget-size fix when the legacy column still exists."""
    if LEGACY_WIDGET_SIZES_COLUMN not in _table_columns(table_name):
        return
    _apply_legacy_column_fix(table_name)


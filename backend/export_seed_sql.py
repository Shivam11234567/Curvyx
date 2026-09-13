import sys
import os
from sqlalchemy import text
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import engine

tables = ['admin_users', 'users', 'coupons', 'categories', 'products', 'product_images', 'product_variants']

def export_sql():
    with engine.connect() as conn:
        with open('supabase_seed_data.sql', 'w', encoding='utf-8') as f:
            f.write("-- Aura Intimates E-Commerce Luxury Lingerie Catalog Seed Data\n")
            f.write("-- Generated automatically\n\n")
            
            for table in tables:
                # Query column names
                cols_res = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' 
                    ORDER BY ordinal_position
                """)).fetchall()
                
                if not cols_res:
                    # SQLite fallback query
                    cols_res = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                    cols = [c[1] for c in cols_res]
                else:
                    cols = [c[0] for c in cols_res]

                cols_str = ', '.join([f'"{c}"' for c in cols])
                
                rows_res = conn.execute(text(f"SELECT * FROM {table}")).fetchall()
                f.write(f"-- Table: {table} ({len(rows_res)} records)\n")
                
                for row in rows_res:
                    vals = []
                    for v in row:
                        if v is None:
                            vals.append('NULL')
                        elif isinstance(v, bool):
                            vals.append('TRUE' if v else 'FALSE')
                        elif isinstance(v, (int, float, Decimal)):
                            vals.append(str(v))
                        elif isinstance(v, str):
                            clean_v = v.replace("'", "''")
                            vals.append(f"'{clean_v}'")
                        else:
                            clean_v = str(v).replace("'", "''")
                            vals.append(f"'{clean_v}'")
                    vals_str = ', '.join(vals)
                    f.write(f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str}) ON CONFLICT (id) DO NOTHING;\n")
                f.write('\n')
                
    print('supabase_seed_data.sql successfully updated!')

if __name__ == "__main__":
    export_sql()

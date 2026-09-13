import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from seed_large_catalog import clean_and_seed_catalog

def seed():
    clean_and_seed_catalog()

if __name__ == "__main__":
    seed()

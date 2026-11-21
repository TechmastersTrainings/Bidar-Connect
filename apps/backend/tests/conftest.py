import os
import pytest

# Ensure all backend automated test runs use an isolated test database
# so that the main application database (/tmp/bidar_connect.db) is never polluted with test/dummy data.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////tmp/bidar_test_isolated.db"


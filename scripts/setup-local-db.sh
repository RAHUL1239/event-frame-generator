#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

DB_USER="${DB_USER:-bmmapp}"
DB_PASS="${DB_PASS:-bmmapp}"
DB_NAME="${DB_NAME:-bmmapp}"

echo "Setting up local PostgreSQL user/database: ${DB_USER}/${DB_NAME}"

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL client not found. Install with:"
  echo "  sudo apt update && sudo apt install -y postgresql postgresql-contrib"
  exit 1
fi

if ! sudo service postgresql start 2>/dev/null; then
  sudo service postgresql status || true
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' CREATEDB;
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB;
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "Done. DATABASE_URL should be:"
echo "  postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting backend setup..."

# Run database migrations (optional, using setup_db.py if needed)
# python setup_db.py

echo "🔥 Launching Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

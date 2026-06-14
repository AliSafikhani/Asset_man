# save as create_structure.py and run with: python create_structure.py
import os

structure = {
    "backend/app/api/v1/endpoints": [],
    "backend/app/api/dependencies": [],
    "backend/app/core": [],
    "backend/app/models": [],
    "backend/app/schemas": [],
    "backend/app/services": [],
    "backend/app/workers/tasks": [],
    "backend/app/utils": [],
    "backend/app/middleware": [],
    "backend/migrations/versions": [],
    "backend/tests/test_api": [],
    "backend/tests/test_services": [],
    "backend/scripts": [],
    "backend/requirements": [],
    "frontend/public": [],
    "frontend/src/api/endpoints": [],
    "frontend/src/hooks": [],
    "frontend/src/context": [],
    "frontend/src/store/slices": [],
    "frontend/src/components/common": [],
    "frontend/src/components/layout": [],
    "frontend/src/components/staticData": [],
    "frontend/src/components/realtime": [],
    "frontend/src/components/testDatasets": [],
    "frontend/src/components/auth": [],
    "frontend/src/pages/Dashboard": [],
    "frontend/src/pages/StaticData": [],
    "frontend/src/pages/Realtime": [],
    "frontend/src/pages/TestDatasets": [],
    "frontend/src/pages/Analytics": [],
    "frontend/src/pages/Settings": [],
    "frontend/src/styles/themes": [],
    "frontend/src/types": [],
    "frontend/src/utils": [],
    "frontend/src/assets/images": [],
    "frontend/src/assets/fonts": [],
    "frontend/src/assets/icons": [],
    "database/postgres/init": [],
    "database/postgres/conf": [],
    "database/timescaledb/init": [],
    "database/timescaledb/conf": [],
    "database/mongodb/init": [],
    "database/migrations/alembic": [],
    "database/migrations/flyway": [],
    "database/migrations/schema_diagrams": [],
    "cache/redis/scripts": [],
    "message_queue/rabbitmq": [],
    "infrastructure/docker": [],
    "infrastructure/kubernetes/backend": [],
    "infrastructure/kubernetes/frontend": [],
    "infrastructure/kubernetes/databases": [],
    "infrastructure/kubernetes/configmaps": [],
    "infrastructure/nginx/sites-available": [],
    "infrastructure/nginx/ssl": [],
    "infrastructure/monitoring/prometheus": [],
    "infrastructure/monitoring/grafana/dashboards": [],
    "infrastructure/monitoring/grafana/datasources": [],
    "infrastructure/monitoring/loki": [],
    "infrastructure/monitoring/tempo": [],
    "infrastructure/logging/fluentd": [],
    "infrastructure/scripts": [],
    "docs/architecture": [],
    "docs/api": [],
    "docs/deployment": [],
    "docs/user": [],
    "tests/e2e/cypress": [],
    "tests/e2e/playwright": [],
    "tests/load_tests/k6_scripts": [],
    "tests/integration": [],
    ".github/workflows": []
}

for dir_path in structure:
    os.makedirs(dir_path, exist_ok=True)
    print(f"✅ Created: {dir_path}")

# Create essential empty files
essential_files = [
    "backend/app/__init__.py",
    "backend/app/main.py",
    "backend/requirements/base.txt",
    "backend/.env.example",
    "backend/docker-compose.yml",
    "frontend/package.json",
    "frontend/vite.config.ts",
    "frontend/.env.example",
    "database/postgres/init/01_schema.sql",
    "database/timescaledb/init/01_hypertable.sql",
    ".gitignore",
    "README.md",
    "Makefile"
]

for file_path in essential_files:
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as f:
        f.write(f"# {os.path.basename(file_path)} created\n")
    print(f"📄 Created: {file_path}")

print("\n✨ Directory structure created successfully!")
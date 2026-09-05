import os
import sys

base_dir = os.path.join(os.getcwd(), 'core-backend')

# List of subdirectories to ensure
subdirs = [
    'app',
    'app/api',
    'app/api/routes',
    'app/models',
    'app/schemas',
    'app/services',
    'app/repositories',
    'app/integrations',
    'app/middleware',
    'tests'
]

for d in subdirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)
    init_path = os.path.join(base_dir, d, '__init__.py')
    if not os.path.exists(init_path):
        with open(init_path, 'w', encoding='utf-8') as f:
            f.write('')

print('Core-backend skeleton created successfully.')

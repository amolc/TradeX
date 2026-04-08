#!/bin/bash
# Start the Django backend on port 5777
# Note: You may want to check for port conflicts since your Vite frontend also uses port 5777.

cd "$(dirname "$0")"

# Activate the virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the server on port 5777
python manage.py runserver 5777

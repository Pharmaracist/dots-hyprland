#!/bin/bash
setup_env() {
    local dir=$1
    local start_cmd=$2

    cd "$dir" || exit 1

    # Create and activate virtual environment if not exists
    if [ ! -d "venv" ]; then
        python -m venv venv
    fi

    source venv/bin/activate

    # Install dependencies if not exists
    if ! pip list --format=freeze | grep -q -v "^-e"; then
        pip install -r requirements.txt
    fi

    $start_cmd &
}

# Function to set up the frontend
setup_frontend() {
    local dir=$1
    local start_cmd=$2
    cd "$dir" || exit 1

    # Install dependencies if not exists
    if [ ! -f "package-lock.json" ] || ! npm list --depth=0 | grep -q "package-name"; then
        npm install
    fi

    # Start the frontend
    $start_cmd &

    # Wait and open in browser
    firefox --new-window http://localhost:3001 &
}

# Backend setup
backend_dir=~/.config/ags/assets/localai/backend
setup_env "$backend_dir" "python app.py"

# Frontend setup
frontend_dir=~/.config/ags/assets/localai/frontend
setup_frontend "$frontend_dir" "npm run dev -- --port 3001"
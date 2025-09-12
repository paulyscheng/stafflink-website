#!/bin/bash

echo "🚀 StaffLink App Launcher"
echo "========================"
echo ""
echo "Which app would you like to launch?"
echo "1) Worker App (工人端)"
echo "2) Company App (企业端)"
echo "3) Both Apps"
echo "4) Website"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "Starting Worker App..."
        cd apps/worker
        npm start
        ;;
    2)
        echo "Starting Company App..."
        cd apps/company
        npm start
        ;;
    3)
        echo "Starting both apps (in separate terminals)..."
        osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/apps/worker && npm start"'
        osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/apps/company && npm start"'
        echo "Both apps launched in separate terminal windows!"
        ;;
    4)
        echo "Starting Website..."
        cd website
        npm run dev
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
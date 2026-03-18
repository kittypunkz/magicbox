@echo off
chcp 65001 >nul

:: Agentation Helper Script for MagicBox

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   🎯 Agentation Guide                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Agentation is a visual annotation tool for AI coding agents.
echo It helps you point at UI bugs and generate structured feedback.
echo.
echo ════════════════════════════════════════════════════════════
echo  HOW TO USE
echo ════════════════════════════════════════════════════════════
echo.
echo 1. START DEVELOPMENT SERVER
echo    Run: dev.bat
echo    Or:  npm run dev
echo.
echo 2. OPEN BROWSER
echo    Go to: http://localhost:3000
echo.
echo 3. ACTIVATE AGENTATION
echo    Look for the icon in the bottom-right corner
echo    Click it to activate annotation mode
echo.
echo 4. ANNOTATE ELEMENTS
echo    • Hover over elements to see them highlighted
echo    • Click an element to add feedback
echo    • Write your notes and click "Add"
echo.
echo 5. COPY TO AI AGENT
echo    • Click the copy button in the toolbar
echo    • Paste into Claude Code, Cursor, or any AI tool
echo    • The AI gets exact selectors and file paths!
echo.
echo ════════════════════════════════════════════════════════════
echo  FEATURES
echo ════════════════════════════════════════════════════════════
echo.
echo   ✅ Click to annotate - Any element on the page
echo   ✅ Text selection - Select specific text for typos
echo   ✅ Multi-select - Drag to select multiple elements
echo   ✅ Area selection - Annotate any region
echo   ✅ Animation pause - Freeze animations to capture states
echo   ✅ Structured output - CSS selectors, React tree, styles
echo.
echo ════════════════════════════════════════════════════════════
echo  TIPS
echo ════════════════════════════════════════════════════════════
echo.
echo   • Be specific: "Button padding should be 8px" not "fix this"
echo   • One issue per annotation - easier for AI to address
echo   • Use text selection for typos or content issues
echo   • Pause animations to annotate specific frames
echo   • Agentation only appears in development mode
echo.
echo ════════════════════════════════════════════════════════════
echo  MCP SERVER (Optional - Real-time sync)
echo ════════════════════════════════════════════════════════════
echo.
echo For real-time annotation syncing with AI agents:
echo   npx add-mcp "npx -y agentation-mcp server"
echo.
echo Or for Claude Code specifically:
echo   npx agentation-mcp init
echo.
echo Learn more: https://www.agentation.com/
echo.

pause

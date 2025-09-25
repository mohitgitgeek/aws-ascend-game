# AWS Ascend Workshop Game - MCP Server

A gamified AWS workshop experience deployed as an MCP (Model Context Protocol) server.

## Game Flow
1. **Check-in** (+10 points)
2. **Workshop 1: Building a Data Lake with AWS**
3. **Task 1: Data Lake Implementation** (+5 points)
4. **Quiz 1: Data Lake Knowledge** (5 questions, +3 correct, -1 wrong)
5. **Workshop 2: Building an app with AWS Q CLI**
6. **Task 2: AWS Q CLI Application** (+5 points)
7. **Quiz 2: AWS Q CLI Knowledge** (5 questions, +3 correct, -1 wrong)
8. **Exit workshop** (+10 points)

**Maximum Score:** 100 points
**Win condition:** Score ≥ 50 points (50%)

## MCP Server Setup

### Install Dependencies
```bash
cd /tmp/aws-ascend-game
npm install
```

### Run as MCP Server
```bash
node mcp-server.js
```

### Available MCP Tools
- `start_game_server` - Start the web server on specified port
- `get_game_status` - Get current game state
- `reset_game` - Reset game to initial state

### Configuration
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "aws-ascend-game": {
      "command": "node",
      "args": ["/tmp/aws-ascend-game/mcp-server.js"],
      "env": {}
    }
  }
}
```

## Usage
1. Connect to the MCP server
2. Use `start_game_server` tool to launch the web interface
3. Open http://localhost:3000 to play the game
4. Use `get_game_status` to monitor progress
5. Use `reset_game` to start over

## Features
- Beautiful Amazon-themed UI with animations
- Shuffled quiz questions for replayability
- Task documentation links
- Real-time scoring system
- MCP integration for programmatic control
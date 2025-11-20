# DevToolCSS MCP Server

MCP (Model Context Protocol) server that bridges AI assistants with Chrome DevTools for DOM and CSS inspection.

## Architecture

This server acts as a bridge between:

1. **MCP Clients** (AI agents) - communicates via stdio
2. **Chrome Extension** - communicates via WebSocket

```
AI Assistant (MCP Client)
    ↕ stdio
MCP Server (this package)
    ↕ WebSocket (port 9333)
Chrome Extension
    ↕ Chrome DevTools Protocol / Extension API
Browser Tabs
```

## Installation

## How It Works

1. **MCP Server** starts and listens for stdio communication from MCP clients
2. **WebSocket Server** starts on specified host:port with `/health` endpoint
3. **Chrome Extension** polls the `/health` endpoint and connects via WebSocket
4. **Tool Requests** flow: MCP Client → stdio → MCP Server → WebSocket → Extension → Chrome DevTools
5. **Responses** flow back: Chrome DevTools → Extension → WebSocket → MCP Server → stdio → MCP Client

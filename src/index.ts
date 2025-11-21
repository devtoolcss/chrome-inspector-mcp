#!/usr/bin/env node

import { DevToolCSSMCPServer } from "./server.js";

/**
 * Main entry point for the DevToolCSS MCP server
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let host = "127.0.0.1";
  let port = 9333;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--host" && args[i + 1]) {
      host = args[i + 1];
      i++;
    } else if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
DevToolCSS MCP Server

Usage: devtoolcss-mcp [options]

Options:
  --host <host>    WebSocket server host (default: 127.0.0.1)
  --port <port>    WebSocket server port (default: 9333)
  --help, -h       Show this help message

The server will:
1. Start a WebSocket server on the specified host:port for Chrome extension connections
2. Expose MCP tools via stdio for AI assistants to use
3. Forward tool requests between the MCP client and Chrome extension

Make sure the Chrome extension is installed and configured to connect to the same host:port.
      `);
      process.exit(0);
    }
  }

  const server = new DevToolCSSMCPServer(host, port);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.error("\n[Main] Shutting down...");
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start the server
  try {
    await server.start();
  } catch (error) {
    console.error("[Main] Failed to start server:", error);
    process.exit(1);
  }
}

main();

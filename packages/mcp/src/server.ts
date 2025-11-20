import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { ExtensionWebSocketServer } from "./websocket.js";

/**
 * MCP Server for Chrome DevTools CSS inspection
 * Connects to Chrome extension via WebSocket and exposes MCP tools
 */
export class DevToolCSSMCPServer {
  private server: McpServer;
  private wsServer: ExtensionWebSocketServer;

  constructor(host: string = "127.0.0.1", port: number = 9333) {
    this.server = new McpServer({
      name: "devtoolcss-mcp",
      version: "0.0.0",
    });

    this.wsServer = new ExtensionWebSocketServer(host, port);
    this.setupTools();
  }

  /**
   * Register all MCP tools
   */
  private setupTools(): void {
    this.server.registerTool(
      "getTabs",
      {
        inputSchema: {},
      },
      async () => {
        const result = await this.wsServer.sendRequest({
          tool: "getTabs",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );

    this.server.registerTool(
      "selectTab",
      {
        inputSchema: {
          tabId: z
            .number()
            .describe("Id of the tab to target for future operations"),
        },
      },
      async ({ tabId }) => {
        const result = await this.wsServer.sendRequest({
          tool: "selectTab",
          tabId,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );

    this.server.registerTool(
      "getNodes",
      {
        inputSchema: {
          expression: z
            .string()
            .describe(
              "DOM expression to evaluate, starting with a node, with `document` and `$0` available. Examples: `document.querySelectorAll('div')`, `div_1.children[0]`",
            ),
        },
      },
      async ({ expression }) => {
        const result = await this.wsServer.sendRequest({
          tool: "getNodes",
          expression,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );

    this.server.registerTool(
      "getMatchedStyles",
      {
        inputSchema: {
          uid: z.string().describe("Node unique identifier"),
          selectors: z
            .array(z.string())
            .optional()
            .describe("Filter regex patterns for CSS selectors"),
          properties: z
            .array(z.string())
            .optional()
            .describe("Filter patterns for CSS properties"),
          appliedOnly: z
            .boolean()
            .optional()
            .describe("Return only applied styles (default: false)"),
          removeUnusedVar: z
            .boolean()
            .optional()
            .describe("Remove unused CSS variables (default: true)"),
        },
      },
      async ({ uid, selectors, properties, appliedOnly, removeUnusedVar }) => {
        const result = await this.wsServer.sendRequest({
          tool: "getMatchedStyles",
          uid,
          selectors,
          properties,
          appliedOnly,
          removeUnusedVar,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );

    this.server.registerTool(
      "getComputedStyle",
      {
        inputSchema: {
          uid: z.string().describe("Node unique identifier"),
          properties: z
            .array(z.string())
            .describe("CSS properties to retrieve"),
        },
      },
      async ({ uid, properties }) => {
        const result = await this.wsServer.sendRequest({
          tool: "getComputedStyle",
          uid,
          properties: properties || [],
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );

    this.server.registerTool(
      "getOuterHTML",
      {
        inputSchema: {
          uid: z.string().describe("Node unique identifier"),
          maxDepth: z
            .number()
            .optional()
            .describe("Maximum depth to traverse (default: 3)"),
          maxLineLength: z
            .number()
            .optional()
            .describe("Maximum line length (default: 200)"),
          maxChars: z
            .number()
            .optional()
            .describe("Maximum total characters (default: 100000)"),
        },
      },
      async ({ uid, maxDepth, maxLineLength, maxChars }) => {
        const result = await this.wsServer.sendRequest({
          tool: "getOuterHTML",
          uid,
          maxDepth,
          maxLineLength,
          maxChars,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      },
    );
  }

  /**
   * Start the MCP server and WebSocket server
   */
  async start(): Promise<void> {
    // Start WebSocket server for extension connection
    await this.wsServer.start();

    // Start MCP server with stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("[MCP] Server started and ready for connections");
  }

  /**
   * Stop the servers
   */
  async stop(): Promise<void> {
    await this.wsServer.stop();
    await this.server.close();
  }
}

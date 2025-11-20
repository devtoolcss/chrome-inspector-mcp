import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

interface ToolRequest {
  id?: string;
  tool: string;
  [key: string]: any;
}

interface ToolResponse {
  id?: string;
  error?: string;
  [key: string]: any;
}

type RequestHandler = (request: ToolRequest) => Promise<any>;

/**
 * WebSocket server that accepts connections from Chrome extension
 * and forwards tool requests to the MCP server
 */
export class ExtensionWebSocketServer {
  private wss: WebSocketServer | null = null;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private client: WebSocket | null = null;
  private requestHandler: RequestHandler | null = null;
  private pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  >();

  constructor(
    private host: string = "127.0.0.1",
    private port: number = 9333,
  ) {}

  /**
   * Set the handler for processing tool requests
   */
  setRequestHandler(handler: RequestHandler): void {
    this.requestHandler = handler;
  }

  /**
   * Start the WebSocket server with health check endpoint
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create HTTP server for health checks
      this.httpServer = createServer((req, res) => {
        if (req.url === "/health" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      // Create WebSocket server
      this.wss = new WebSocketServer({ server: this.httpServer });

      this.wss.on("connection", (ws: WebSocket) => {
        console.error("[WS] Extension connected");
        this.client = ws;

        ws.on("message", async (data: Buffer) => {
          try {
            const response: ToolResponse = JSON.parse(data.toString());
            console.error("[WS] Received response:", response);

            // Handle responses to our requests
            if (response.id && this.pendingRequests.has(response.id)) {
              const { resolve, reject } = this.pendingRequests.get(
                response.id,
              )!;
              this.pendingRequests.delete(response.id);

              if (response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            }
          } catch (error) {
            console.error("[WS] Failed to parse message:", error);
          }
        });

        ws.on("close", () => {
          console.error("[WS] Extension disconnected");
          this.client = null;
          // Reject all pending requests
          for (const [id, { reject }] of this.pendingRequests) {
            reject(new Error("WebSocket connection closed"));
          }
          this.pendingRequests.clear();
        });

        ws.on("error", (error) => {
          console.error("[WS] WebSocket error:", error);
        });
      });

      this.httpServer.listen(this.port, this.host, () => {
        console.error(
          `[WS] Server listening on http://${this.host}:${this.port}`,
        );
        resolve();
      });

      this.httpServer.on("error", reject);
    });
  }

  /**
   * Send a tool request to the extension and wait for response
   */
  async sendRequest(request: ToolRequest): Promise<any> {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      throw new Error(
        "Extension not connected. Please ensure the Chrome extension is installed and running.",
      );
    }

    const id = request.id || uuidv4();
    const requestWithId = { ...request, id };

    return new Promise((resolve, reject) => {
      // Store the promise handlers
      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000); // 30 second timeout

      // Send request
      this.client!.send(JSON.stringify(requestWithId), (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pendingRequests.delete(id);
          reject(error);
        }
      });

      // Clear timeout when promise settles
      const originalResolve = resolve;
      const originalReject = reject;
      resolve = (value: any) => {
        clearTimeout(timeout);
        originalResolve(value);
      };
      reject = (error: Error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

      this.pendingRequests.set(id, { resolve, reject });
    });
  }

  /**
   * Stop the WebSocket server
   */
  async stop(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }
  }
}

// UUID implementation if not using external library
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

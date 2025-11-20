import { truncateHTML } from "./htmlUtils.js";
import { filterMatchedStyles, toStyleSheetText } from "./styleUtils.js";
import { evaluateDOMExpression } from "./DOMExpression.js";

import { NodeUidManager } from "./NodeUidManager.js";
import { InspectorManager } from "./InspectorManager.js";
import { InspectorElement } from "chrome-inspector";

interface ToolRequest {
  tool: string;
  [key: string]: any;
}

const inspectorManager = new InspectorManager();
const nodeManager = new NodeUidManager();

async function processRequest(
  tabId: number,
  request: ToolRequest,
): Promise<any> {
  console.log(`processRequest - tabId: ${tabId}, request:`, request);
  const inspector =
    inspectorManager.get(tabId) ?? (await inspectorManager.create(tabId));

  switch (request.tool) {
    case "getNodes": {
      // Unified node retrieval using DOM expression syntax
      if (!request.expression) {
        throw new Error("Missing 'expression' parameter");
      }
      return await evaluateDOMExpression(
        request.expression,
        inspector,
        nodeManager,
      );
    }

    case "getMatchedStyles": {
      const {
        uid,
        selectors,
        properties,
        appliedOnly = false,
        removeUnusedVar = true,
      } = request;
      const node = nodeManager.getNode(uid, inspector);
      if (!node) {
        throw new Error(`Node not found for uid: ${uid}`);
      } else if (!(node instanceof InspectorElement)) {
        throw new Error(
          `Non-element nodes do not support styles for uid: ${uid}`,
        );
      }
      const options = {
        parseOptions: { removeUnusedVar },
      };
      let styles = await node.getMatchedStyles(options);

      // Apply filters to reduce response size
      styles = filterMatchedStyles(styles, {
        selectors,
        properties,
        appliedOnly,
      });
      const toStyleSheetOptions = {
        applied: appliedOnly ? false : true,
        matchedSelectors: true,
      };
      const styleSheetText = toStyleSheetText(
        styles,
        node,
        toStyleSheetOptions,
      );
      console.log("serveRequest - getMatchedStyles styles:", styleSheetText);

      return { styles: styleSheetText };
    }

    case "getComputedStyle": {
      const { uid, properties = [] } = request;
      const node = nodeManager.getNode(uid, inspector);
      if (!node) {
        throw new Error("Node not found for uid: " + uid);
      } else if (!(node instanceof InspectorElement)) {
        throw new Error(
          `Non-element nodes do not support styles for uid: ${uid}`,
        );
      }

      const styles = await node.getComputedStyle();
      const filtered: Record<string, string> = {};
      properties.map((prop: string) => {
        filtered[prop] = styles[prop];
      });
      console.log("serveRequest - getComputedStyle styles:", filtered);
      return { styles: filtered };
    }

    case "getOuterHTML": {
      // some safe defaults
      const {
        uid,
        maxDepth = 3,
        maxLineLength = 200,
        maxChars = 100000,
      } = request;
      const node = nodeManager.getNode(uid, inspector);
      if (!node) {
        throw new Error(`Node not found for uid: ${uid}`);
      } else if (!node.tracked) {
        throw new Error(`Node is no longer existed for uid: ${uid}`);
      }
      // Apply depth and line length controls if provided
      const html = truncateHTML(
        node._docNode,
        maxDepth,
        maxLineLength,
        maxChars,
      );
      console.log("serveRequest - getOuterHTML html:", html);
      return { outerHTML: html };
    }

    default:
      throw new Error("Unknown tool: " + request.tool);
  }
}

// listener must be sync, return true to indicate async response
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.receiver !== "offscreen") return;

  switch (msg.event) {
    case "REQUEST":
      processRequest(msg.tabId, msg.request)
        .then(sendResponse)
        .catch((error: any) => {
          sendResponse({ error: error.message || String(error) });
        });
      return true; // Keep the message channel open for async response
  }
});

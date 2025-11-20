import { chromeDebugger } from "./ChromeDebuggerBridge.js";
import { Inspector } from "chrome-inspector";

// inspector management per tab
export class InspectorManager {
  private inspectors: Record<number, Inspector>;
  private tab$0Map: Map<number, string>;

  constructor() {
    this.inspectors = {};
    // record $0 xpaths for tabs not having inspector yet
    this.tab$0Map = new Map();

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      switch (msg.event) {
        case "TAB_CLOSED":
          if (this.get(msg.tabId)) {
            chromeDebugger.detach({ tabId: msg.tabId });
            this.remove(msg.tabId);
            // TODO: cleanup nodeUidManager
          }
          break;

        case "DEBUGGER_DETACHED":
          if (this.get(msg.tabId)) {
            this.remove(msg.tabId);
            console.log(
              `Inspector for tab ${msg.tabId} detached for ${msg.reason}`,
            );
            // TODO: cleanup nodeUidManager
          }
          break;

        case "SET_INSPECTED_TAB_$0":
          this.tab$0Map.set(msg.tabId, msg.xpath);
          break;
      }
    });
  }

  async create(tabId: number): Promise<Inspector> {
    await chromeDebugger.attach({ tabId }, "1.3");
    this.inspectors[tabId] = await Inspector.fromChromeDebugger(
      chromeDebugger as unknown as typeof chrome.debugger,
      tabId,
      { $0XPath: this.tab$0Map.get(tabId) },
    );
    return this.inspectors[tabId];
  }

  get(tabId: number): Inspector | undefined {
    return this.inspectors[tabId];
  }

  remove(tabId: number): void {
    delete this.inspectors[tabId];
  }
}

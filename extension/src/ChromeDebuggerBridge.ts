interface DebuggerTarget {
  tabId: number;
}

interface DebuggerMessage {
  receiver: string;
  event: string;
  target?: DebuggerTarget;
  method?: string;
  params?: any;
}

interface DebuggerResponse {
  error?: string;
  result?: any;
}

interface RuntimeMessage {
  event: string;
  source?: DebuggerTarget;
  method?: string;
  params?: any;
}

type DebuggerEventListener = (
  source: DebuggerTarget,
  method: string,
  params: any,
) => void;

async function sendDebuggerMessage(
  payload: Omit<DebuggerMessage, "receiver">,
): Promise<any> {
  const response: DebuggerResponse = await chrome.runtime.sendMessage({
    receiver: "background",
    ...payload,
  });

  if (response?.error) {
    throw new Error(response.error);
  } else {
    return response?.result;
  }
}

// A chrome.debugger wrapper implemented in runtime.messaging for offscreen context
class ChromeDebuggerBridge {
  _listeners = new Set<DebuggerEventListener>();

  constructor() {
    chrome.runtime.onMessage.addListener(
      (msg: RuntimeMessage, sender, sendResponse) => {
        switch (msg.event) {
          case "DEBUGGER_EVENT":
            const { source, method, params } = msg;
            this._dispatchEvent(source, method, params);
            break;
        }
      },
    );
  }

  async attach(target: DebuggerTarget, version: string): Promise<any> {
    return sendDebuggerMessage({
      event: "DEBUGGER_ATTACH",
      target,
    });
  }

  async detach(target: DebuggerTarget): Promise<any> {
    return sendDebuggerMessage({
      event: "DEBUGGER_DETACH",
      target,
    });
  }

  // Send command to the actual chrome.debugger in background.js
  async sendCommand(
    target: DebuggerTarget,
    method: string,
    params?: any,
  ): Promise<any> {
    return sendDebuggerMessage({
      event: "DEBUGGER_SEND_COMMAND",
      target,
      method,
      params,
    });
  }

  onEvent = {
    addListener: (callback: DebuggerEventListener): void => {
      this._listeners.add(callback);
    },
    removeListener: (callback: DebuggerEventListener): void => {
      this._listeners.delete(callback);
    },
  };

  // Internal method to dispatch events to listeners
  _dispatchEvent(source: DebuggerTarget, method: string, params: any): void {
    for (const listener of this._listeners) {
      try {
        listener(source, method, params);
      } catch (e) {
        console.error("Error in debugger event listener:", e);
      }
    }
  }
}

// A chrome.debugger wrapper implemented in runtime.messaging for offscreen context
export const chromeDebugger = new ChromeDebuggerBridge();

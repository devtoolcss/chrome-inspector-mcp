# Chrome Inspector MCP

This gives agents DOM Elements, CSS Rules, and Computed Style, the tools that `chrome-devtools-mcp` doesn't provide.

This redesign of DevTools MCP aims to enable agents to take over DevTools for complex debugging. Any suggestions are welcomed. Current directions includes:

- Agent Ergonomics: Building directly on [Chrome DevTools Protocol (CDP)](https://chromedevtools.github.io/devtools-protocol/), designing for agent needs, not library constraints
- Extensibility: Making it easy for users (and agents?) to hack and customize their own toolsets

## Demo

https://github.com/user-attachments/assets/c880a415-f35a-4fc4-93c4-001030116b90

## Installation

1. Install the extension from [Releases](https://github.com/devtoolcss/chrome-inspector-mcp/releases)

2. Add the following config to your MCP client:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-inspector-mcp@latest"]
    }
  }
}
```

## Tools

- [`getTabs`](./tools.md#gettabs)
- [`selectTab`](./tools.md#selecttabs)
- [`getNodes`](./tools.md#getnodes)
- [`getMatchedStyles`](./tools.md#getmatchedstyles)
- [`getComputedStyle`](./tools.md#getcomputedstyle)
- [`getOuterHTML`](./tools.md#getouterhtml)

### TODO

- console js & message
- device emulation

### Guidelines

1. **Generalization**: Prefer taking programmatic expression. Let models code.

2. **Filtering**: When raw output could be large, provide built-in filtering logic.

## How it works

When Chrome starts, the extension's background worker polls a specific port every few seconds. When the MCP server starts at the address they connect. By manifest v3, one background worker serves one profile, so the MCP server can access all its tabs (TODO: filtering).

Currently, the extension handles all DevTools logic and the MCP server is just a relay. Yet Chrome extension has many restrictions, so I planed to forward `chrome` API and keep things in MCP's Nodejs runtime following [playwright-mcp's design](https://github.com/microsoft/playwright-mcp/tree/main/extension).

The inspection logic is implemented in [chrome-inspector](https://github.com/devtoolcss/chrome-inspector), a programming interface wrapping [CDP](https://chromedevtools.github.io/devtools-protocol/) to DOM methods.

## Inspector MCP

The DevTools MCP for inspecting DOM elements and CSS rules

This gives agents DOM Elements, CSS Rules, and Computed Style, the bread and butter for frontend development.

Most Chrome DevTools Protocol (CDP) logics are in [chrome-inspector](https://github.com/devtoolcss/chrome-inspector), a programming interface wrapping CDP to DOM methods. This MCP aims to explore the optimal interface for LLMs to control DevTools for complex debugging.

### Tools

5 tools

- `getTabs`
- `getNodes`
  - document, $0, or uid as variable (.getElementById)
  - querySelector, parent, children[0], etc
  - return uids
- `getMatchedStyles` (optionally filter by selector, properties, appliedOnly)
- `getComputedStyle` (must specify wanted attr array)
- `getOuterHTML` (with depth/line lenght control)

**TODO**

- auto detach, better config panel

---

- console js & message
- device emulation

### Guidelines:

1. Generalization (best to allow programmatic expression. best to only explain rules instead of full functionality.)
2. Filtering (If raw output can be too large, we should have predefined filtering logic. This way, the tool's value is like a lib function that doesn't require LLM implement everytime)
3. Minimal (Less is more. Less unneeded description, better response and longer use.)

## Archtecture

chrome extension (ws polling) + stateful inspectors + lazy init

### Connection

comparison between Extension API vs Remote Debugging Port

used by:
browser devtools access:
avaliable sites: except chrome://
profile:
XXX is debugging your browser

in theory, Remote Debugging Port gives the most power, but its setup is also more inconvenient

---

For Chrome Extensions, there are two ways to communicate with local process: ws+polling (extension as client) vs native messaging (server)

Unlike [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome), we opt for http polling + ws for easier maintaince. The polling usage should be marginal, you can also manually turn on/off.

one profile is not intended for multiple persons to use simultaneously, so following chrome-extension design, one mcp per profile is good. for multi agent use, each agent can config its extension and mcp port.

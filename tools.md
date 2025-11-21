## `getTabs`

**Parameters:**

None

**Sample result:**

```json
{
  "tabs": [
    {
      "id": 123,
      "title": "Example Page",
      "url": "https://example.com",
      "active": true,
      "lastAccessed": "5min ago"
    }
  ]
}
```

---

## `selectTab`

**Parameters:**

- **tabId** (number) **(required)**: Id of the tab to target for future operations

**Sample result:**

```json
{
  "selectedTabId": 123
}
```

---

## `getNodes`

**Parameters:**

- **expression** (string) **(required)**: DOM expression to evaluate, starting with a node, with `document` and `$0` available. Examples: `document.querySelectorAll('div')`, `div_1.children[0]`

**Sample result:**

```json
{
  "nodes": ["div_0", "div_1"]
}
```

---

## `getMatchedStyles`

**Parameters:**

- **node** (string) **(required)**: Node identifier
- **selectors** (array of strings) _(optional)_: Filter regex patterns for CSS selectors
- **properties** (array of strings) _(optional)_: Filter patterns for CSS properties
- **appliedOnly** (boolean) _(optional)_: Return only applied styles (default: false)
- **removeUnusedVar** (boolean) _(optional)_: Remove unused CSS variables (default: true)

**Sample result:**

```css
/* Matched: ::after */
*,
::before,
::after {
  box-sizing: border-box; /* applied */
}

body {
  display: block; /* applied */
  margin: 8px;
}

/* Inherited from html */
/* Matched: html */
html,
:host {
  line-height: 1.5;
}
```

---

## `getComputedStyle`

**Parameters:**

- **node** (string) **(required)**: Node identifier
- **properties** (array of strings) **(required)**: CSS properties to retrieve

**Sample result:**

```json
{
  "display": "block",
  "width": "1920px"
}
```

---

## `getOuterHTML`

**Parameters:**

- **node** (string) **(required)**: Node identifier
- **maxDepth** (number) _(optional)_: Maximum depth to traverse (default: 3)
- **maxLineLength** (number) _(optional)_: Maximum line length (default: 200)

**Sample result:**

```html
<body>
  <div id="root" class="w-full">
    <div class="flex h-screen bg-background">
      <div class="bg-card border-r"><!--... 90 more element(s), 15 text node(s), max depth +8--></div>
      <div class="flex-1 flex"><!--... 199 more element(s), 97 text node(s), max depth +12--></div>
    </div>
    <div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;">
      <ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol>
    </div>
  </div>
</body>
```

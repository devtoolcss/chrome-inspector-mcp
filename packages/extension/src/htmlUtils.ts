import beautify from "js-beautify";

interface StructureSummary {
  elements: number;
  textNodes: number;
  totalDepth: number;
}

export function truncateHTML(
  element: Element,
  maxDepth?: number,
  maxLineLength?: number,
): string {
  let pruned = truncateByDepth(element, maxDepth) as Element;

  // Get HTML string
  let html = pruned.outerHTML;
  html = beautify.html(html, {
    indent_size: 2,
    wrap_line_length: 0, // Don't wrap - let truncateByLineLength handle it
    preserve_newlines: false,
  });

  // Truncate by line length
  if (maxLineLength !== undefined && maxLineLength > 0) {
    html = truncateByLineLength(html, maxLineLength);
  }

  return html;
}

/**
 * Counts the structure of remaining nodes
 * @param node - The DOM node to analyze
 * @returns Summary of node counts
 */
function summarizeRemainingStructure(node: Node): StructureSummary {
  const summary: StructureSummary = {
    elements: 0,
    textNodes: 0,
    totalDepth: 0,
  };

  function traverse(n: Node, depth: number): void {
    summary.totalDepth = Math.max(summary.totalDepth, depth);

    for (let child of n.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        summary.elements++;
        traverse(child, depth + 1);
      } else if (
        child.nodeType === Node.TEXT_NODE &&
        child.textContent?.trim()
      ) {
        summary.textNodes++;
      }
    }
  }

  traverse(node, 0);
  return summary;
}

/**
 * Truncates a DOM node by maximum nesting depth
 * @param node - The DOM node to truncate
 * @param maxDepth - Maximum depth to traverse
 * @returns Cloned and truncated node
 */
function truncateByDepth(node: Node, maxDepth: number): Node {
  // Clone the node without children
  const clone = node.cloneNode(false);

  // If we're at max depth, add summary comment and return
  if (maxDepth <= 0) {
    if (clone.nodeType === Node.ELEMENT_NODE) {
      const summary = summarizeRemainingStructure(node);
      const summaryText = `... ${summary.elements} more element(s), ${summary.textNodes} text node(s), max depth +${summary.totalDepth}`;
      if (summary.totalDepth > 0)
        (clone as Element).appendChild(document.createComment(summaryText));
    }
    return clone;
  }

  // Process children
  for (let child of node.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      // Recursively truncate element children
      clone.appendChild(truncateByDepth(child, maxDepth - 1));
    } else if (
      child.nodeType === Node.TEXT_NODE ||
      child.nodeType === Node.COMMENT_NODE
    ) {
      // Copy text and comment nodes as-is
      clone.appendChild(child.cloneNode(true));
    }
  }

  return clone;
}

/**
 * Truncates each line of text to a maximum length
 * @param text - The text to truncate
 * @param maxLineLength - Maximum length per line
 * @returns Text with truncated lines
 */
function truncateByLineLength(text: string, maxLineLength: number): string {
  const lines = text.split("\n");
  return lines
    .map((line) =>
      line.length > maxLineLength
        ? line.substring(0, maxLineLength - 3) + "..."
        : line,
    )
    .join("\n");
}

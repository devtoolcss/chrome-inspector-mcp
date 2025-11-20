// From https://github.com/devtoolcss/chrome-inspector/blob/main/extension/xpath.js
// Licensed under MIT License

export function getAbsoluteXPath(node: Node | null): string {
  if (!node) return "";
  const pathSegments: string[] = [];

  while (node && node.nodeType !== Node.DOCUMENT_NODE) {
    let segment = "";
    let index = 1;
    let sibling = node.previousSibling as Node | null;

    switch (node.nodeType) {
      case Node.ELEMENT_NODE: {
        const element = node as Element;
        const ns = element.namespaceURI;
        let prefix = "";
        if (ns === "http://www.w3.org/2000/svg") prefix = "svg:";
        else if (ns === "http://www.w3.org/1999/xhtml") prefix = ""; // default HTML

        while (sibling) {
          if (
            sibling.nodeType === Node.ELEMENT_NODE &&
            sibling.nodeName === element.nodeName
          )
            index++;
          sibling = sibling.previousSibling;
        }

        segment = `${prefix}${element.localName}[${index}]`;
        break;
      }

      case Node.TEXT_NODE:
        while (sibling) {
          if (sibling.nodeType === Node.TEXT_NODE) index++;
          sibling = sibling.previousSibling;
        }
        segment = `text()[${index}]`;
        break;

      case Node.COMMENT_NODE:
        while (sibling) {
          if (sibling.nodeType === Node.COMMENT_NODE) index++;
          sibling = sibling.previousSibling;
        }
        segment = `comment()[${index}]`;
        break;

      case Node.ATTRIBUTE_NODE:
        const attr = node as Attr;
        const ownerPath = getAbsoluteXPath(attr.ownerElement);
        return `${ownerPath}/@${attr.nodeName}`;

      default:
        segment = `node()[${index}]`;
    }

    pathSegments.unshift(segment);
    node = node.parentNode;
  }

  return "/" + pathSegments.join("/");
}

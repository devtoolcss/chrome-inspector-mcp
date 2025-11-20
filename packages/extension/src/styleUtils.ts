import type { InspectorElement, ParsedCSS } from "chrome-inspector";

type ParsedCSSPropertyValue = ParsedCSS["inline"][0];
type ParsedCSSRule = ParsedCSS["matched"][0];
/**
 * Filters matched styles response to reduce size
 * @param styles - The matched styles object from chrome-inspector
 * @param filter - Filter options
 * @returns Filtered matched styles
 */
export function filterMatchedStyles(
  styles: ParsedCSS,
  filter: {
    selectors?: string[];
    properties?: string[];
    appliedOnly?: boolean;
  },
): ParsedCSS {
  if (filter.selectors) {
    const selectorRegexes = filter.selectors
      ? filter.selectors.map((pattern) => new RegExp(pattern))
      : null;
    const filterRulesBySelectors = (
      rules: ParsedCSSRule[],
    ): ParsedCSSRule[] => {
      return rules.filter((rule) => {
        return selectorRegexes!.some((regex) =>
          regex.test(rule.matchedSelectors.join(", ")),
        );
      });
    };
    styles.matched = filterRulesBySelectors(styles.matched);
    styles.pseudoElements = filterRulesBySelectors(styles.pseudoElements);
  }

  const filterAllProperties = (
    styles: ParsedCSS,
    filterFn: (decl: ParsedCSSPropertyValue) => boolean,
  ): void => {
    const filterProperties = (
      properties: ParsedCSSPropertyValue[],
    ): ParsedCSSPropertyValue[] => {
      return properties.filter(filterFn);
    };
    for (const parentCSS of styles.inherited) {
      parentCSS.inline = filterProperties(parentCSS.inline);
      for (const rule of parentCSS.matched) {
        rule.properties = filterProperties(rule.properties);
      }
    }
    styles.attributes = filterProperties(styles.attributes);
    for (const rule of styles.matched) {
      rule.properties = filterProperties(rule.properties);
    }
    for (const rule of styles.pseudoElements) {
      rule.properties = filterProperties(rule.properties);
    }
    styles.inline = filterProperties(styles.inline);
  };

  if (filter.properties) {
    const propertiesSet = new Set(filter.properties);
    const filterFn = (decl: ParsedCSSPropertyValue): boolean =>
      Array.from(propertiesSet).some((prop) => decl.name.includes(prop));
    filterAllProperties(styles, filterFn);
  }

  if (filter.appliedOnly) {
    const filterFn = (decl: ParsedCSSPropertyValue): boolean =>
      decl.applied === true;
    filterAllProperties(styles, filterFn);
  }

  return styles;
}

interface CommentConfig {
  origin?: boolean;
  matchedSelectors?: boolean;
  applied?: boolean;
}

export function toStyleSheetText(
  styles: ParsedCSS,
  element: InspectorElement,
  commentConfig: CommentConfig = {},
): string {
  let cssText = "";

  const toCSSRuleText = (rule: {
    allSelectors: string[];
    matchedSelectors: string[];
    properties: ParsedCSSPropertyValue[];
    origin?: string;
  }): string => {
    const allSelectorsStr = rule.allSelectors.join(", ");
    const matchedSelectorsStr = rule.matchedSelectors.join(", ");
    let css = "";
    // TODO: inspector need CSS.styleSheetAdded event to get origin info
    //if (commentConfig.origin && rule.origin) {
    //  css += `/* Origin: ${rule.origin} */\n`;
    //}
    if (
      commentConfig.matchedSelectors &&
      matchedSelectorsStr !== allSelectorsStr
    ) {
      css += `/* Matched: ${matchedSelectorsStr} */\n`;
    }
    css += `${allSelectorsStr} {\n`;
    for (const prop of rule.properties) {
      css += `  ${prop.name}: ${prop.value};`;
      if (commentConfig.applied && prop.applied) {
        css += ` /* applied */`;
      }
      css += "\n";
    }
    css += `}\n\n`;
    return css;
  };

  // inline
  if (styles.inline.length > 0) {
    cssText += toCSSRuleText({
      allSelectors: ["element.style"],
      matchedSelectors: ["element.style"],
      properties: styles.inline,
    });
  }

  // matched & pseudoElements
  const allMatchedRules = [
    ...styles.matched,
    ...styles.pseudoElements,
  ].reverse();

  for (const rule of allMatchedRules) {
    if (rule.properties.length > 0) cssText += toCSSRuleText(rule);
  }

  // attributes
  if (styles.attributes.length > 0) {
    const selectorPlaceholder = `${element.nodeName.toLowerCase()}[Attributes Style]`;
    cssText += toCSSRuleText({
      allSelectors: [selectorPlaceholder],
      matchedSelectors: [selectorPlaceholder],
      properties: styles.attributes,
    });
  }

  for (const parentCSS of styles.inherited) {
    const { inline, matched, distance } = parentCSS;
    if (
      inline.length === 0 &&
      matched.every((rule) => rule.properties.length === 0)
    )
      continue;

    const getParentSelector = (
      element: InspectorElement,
      distance: number,
    ): string => {
      let parentNode: InspectorElement = element;
      for (let i = 0; i < distance; i++) {
        if (parentNode.parentNode === null)
          throw new Error("getParentSelector: No parent node");
        parentNode = parentNode.parentNode as InspectorElement;
      }
      let parentSelector = parentNode.nodeName.toLowerCase();
      if (parentNode.id) {
        parentSelector += `#${parentNode.id}`;
      } else if (parentNode.classList && parentNode.classList.length > 0) {
        parentSelector += `.${[...parentNode.classList].slice(0, 3).join(".")}`;
      }
      return parentSelector;
    };
    cssText += `/* Inherited from ${getParentSelector(element, distance)} */\n`;

    if (inline.length > 0) {
      cssText += toCSSRuleText({
        allSelectors: ["style attribute"],
        matchedSelectors: ["style attribute"],
        properties: inline,
      });
    }
    for (const rule of matched) {
      if (rule.properties.length > 0) {
        cssText += toCSSRuleText(rule);
      }
    }
  }
  return cssText;
}

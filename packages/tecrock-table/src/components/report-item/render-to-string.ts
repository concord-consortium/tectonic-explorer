import React from "react";
import * as ReactDOM from "react-dom";
import { inlineContent } from "juice";

export const renderToString = (element: React.ReactNode) => {
  const div = document.createElement("div");
  ReactDOM.render(element as any, div);
  return div.innerHTML;
};

export const renderToStringWithCss = (element: React.ReactNode, css: string, classMap?: Record<string, string>) => {
  const html = renderToString(element);
  if (classMap) {
    css = replaceCssClassNames(css, classMap);
  }
  return inlineContent(html, css);
};

// This function is useful to replace class names in a raw CSS string with new class names provided by CSS modules.
export const replaceCssClassNames = (cssString: string, classMap: Record<string, string>): string => {
  // Create a regular expression that matches all keys in the classMap.
  const classNamesRegex = new RegExp(`\\.(${Object.keys(classMap).join('|')})`, 'g');

  return cssString.replace(classNamesRegex, (match) => {
    // Extract the class name without the dot.
    const className = match.substring(1);

    // Replace with the new class name, re-adding the dot.
    return `.${classMap[className]}`;
  });
};

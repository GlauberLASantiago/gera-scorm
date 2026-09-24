import katex from "katex";
export function mathMarkup(source: string) {
  return katex.renderToString(source || "E=mc^2", {
    output: "mathml",
    throwOnError: false,
    displayMode: true,
    trust: false,
  });
}

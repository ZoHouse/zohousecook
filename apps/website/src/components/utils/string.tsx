function convertRichToPlainText(rtf: string) {
  rtf = rtf.replace(/\\par[d]?/g, "");
  return rtf
    .replace(
      /\\{\\*?\\\\[^{}]+}|[{}]|\\\\\\n?[A-Za-z]+\\n?(?:-?\\d+)?[ ]?/g,
      ""
    )
    .trim();
}

export { convertRichToPlainText };

/**
 * Cleans extracted text from PDF documents using heuristics:
 * 1. Strips standalone page numbers and "Page X of Y" patterns
 * 2. Removes repeated header / footer lines across sections
 * 3. Normalizes excessive whitespace and preserves paragraph breaks
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText || !rawText.trim()) {
    return '';
  }

  // 1. Normalize line breaks
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // 2. Count line frequencies to identify repeating headers/footers
  const lineFrequency = new Map<string, number>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 3 && trimmed.length < 100) {
      lineFrequency.set(trimmed, (lineFrequency.get(trimmed) || 0) + 1);
    }
  }

  // Lines appearing more than 4 times across a document are likely repeating running headers/footers
  const repeatingThreshold = 4;

  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();

    // Check if line is empty (preserve single empty lines for paragraph separation)
    if (!trimmed) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      continue;
    }

    // Heuristic A: Page number patterns (e.g., "Page 12", "12 of 45", standalone numbers)
    const isPageNumber = /^(page\s+\d+(\s+of\s+\d+)?|\d+\s+of\s+\d+|\d+)$/i.test(trimmed);
    if (isPageNumber) {
      continue;
    }

    // Heuristic B: Repeated running headers or footers
    const count = lineFrequency.get(trimmed) || 0;
    if (count >= repeatingThreshold) {
      // Check if it looks like a typical header/footer (all caps, date stamps, or copyright)
      const isHeaderFooter =
        trimmed.toUpperCase() === trimmed ||
        /copyright|all rights reserved|confidential|draft|lecture\s+\d+/i.test(trimmed);
      if (isHeaderFooter) {
        continue;
      }
    }

    cleanedLines.push(trimmed);
  }

  // 3. Rejoin and collapse excessive blank lines (max 2 consecutive newlines)
  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

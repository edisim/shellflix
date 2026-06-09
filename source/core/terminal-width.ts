const ellipsis = '…';

export function displayWidth(value: string): number {
  let width = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (isZeroWidth(codePoint)) {
      continue;
    }

    width += isWide(codePoint) ? 2 : 1;
  }

  return width;
}

export function padTerminalEnd(value: string, width: number): string {
  const padding = width - displayWidth(value);
  return padding > 0 ? `${value}${' '.repeat(padding)}` : value;
}

export function truncateTerminal(value: string, width: number): string {
  if (displayWidth(value) <= width) {
    return value;
  }

  const targetWidth = Math.max(0, width - displayWidth(ellipsis));
  let result = '';
  let resultWidth = 0;

  for (const character of value) {
    const characterWidth = displayWidth(character);

    if (resultWidth + characterWidth > targetWidth) {
      break;
    }

    result += character;
    resultWidth += characterWidth;
  }

  return `${result}${ellipsis}`;
}

function isZeroWidth(codePoint: number): boolean {
  return codePoint === 0x200D ||
    codePoint === 0xFE0E ||
    codePoint === 0xFE0F ||
    (codePoint >= 0x0300 && codePoint <= 0x036F) ||
    (codePoint >= 0x1AB0 && codePoint <= 0x1AFF) ||
    (codePoint >= 0x1DC0 && codePoint <= 0x1DFF) ||
    (codePoint >= 0x20D0 && codePoint <= 0x20FF) ||
    (codePoint >= 0xFE20 && codePoint <= 0xFE2F) ||
    (codePoint >= 0x1F3FB && codePoint <= 0x1F3FF);
}

function isWide(codePoint: number): boolean {
  return (codePoint >= 0x1100 && codePoint <= 0x115F) ||
    codePoint === 0x2329 ||
    codePoint === 0x232A ||
    (codePoint >= 0x2E80 && codePoint <= 0xA4CF) ||
    (codePoint >= 0xAC00 && codePoint <= 0xD7A3) ||
    (codePoint >= 0xF900 && codePoint <= 0xFAFF) ||
    (codePoint >= 0xFE10 && codePoint <= 0xFE19) ||
    (codePoint >= 0xFE30 && codePoint <= 0xFE6F) ||
    (codePoint >= 0xFF00 && codePoint <= 0xFF60) ||
    (codePoint >= 0xFFE0 && codePoint <= 0xFFE6) ||
    (codePoint >= 0x1F000 && codePoint <= 0x1FAFF) ||
    (codePoint >= 0x2600 && codePoint <= 0x27BF) ||
    codePoint === 0x2B50;
}

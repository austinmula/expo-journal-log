export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

export function getPreview(content: string, maxLength: number = 150): string {
  // Remove extra whitespace and newlines
  const cleaned = content.replace(/\s+/g, ' ').trim();
  return truncate(cleaned, maxLength);
}

export function generateTitleFromContent(content: string): string {
  // Get first line or first sentence
  const firstLine = content.split('\n')[0].trim();

  if (firstLine.length <= 50) {
    return firstLine || 'Untitled';
  }

  // Try to find a sentence boundary
  const sentenceEnd = firstLine.indexOf('. ');
  if (sentenceEnd > 0 && sentenceEnd <= 50) {
    return firstLine.slice(0, sentenceEnd + 1);
  }

  // Just truncate at a word boundary
  const truncated = firstLine.slice(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 30) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

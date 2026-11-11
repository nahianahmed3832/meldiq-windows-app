const gamingPages = [
  ["en", "/gaming-community-chat"],
  ["es", "/es/chat-para-comunidades-gaming"],
  ["x-default", "/gaming-community-chat"],
] as const;

export function isSpanishPage(path: string): boolean {
  return path.startsWith("/es/");
}

export function gamingAlternates(path: string) {
  return gamingPages.some(([, page]) => page === path) ? gamingPages : [];
}

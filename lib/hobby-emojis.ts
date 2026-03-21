export const HOBBY_EMOJIS: Record<string, string> = {
  photography: '📷', cooking: '🍳', yoga: '🧘', reading: '📚',
  gaming: '🎮', music: '🎵', travel: '✈️', hiking: '🥾',
  cycling: '🚴', running: '🏃', diving: '🤿', skiing: '⛷️',
  surfing: '🏄', tennis: '🎾', golf: '⛳', painting: '🎨',
  gardening: '🌱', fishing: '🎣', climbing: '🧗', dancing: '💃',
  swimming: '🏊', boxing: '🥊', basketball: '🏀', football: '⚽',
  volleyball: '🏐', sailing: '⛵', kayaking: '🛶', paddle: '🏓',
  snowboarding: '🏂', skateboarding: '🛹', chess: '♟️', writing: '✍️',
  singing: '🎤', guitar: '🎸', piano: '🎹', drums: '🥁',
  pottery: '🏺', knitting: '🧶', sewing: '🧵', baking: '🧁',
  wine: '🍷', coffee: '☕', meditation: '🧘', astronomy: '🔭',
  bird: '🐦', dog: '🐕', cat: '🐱', horse: '🐴',
  scuba: '🤿', wakeboarding: '🏄', paddleboard: '🏄', jet: '🚤',
  motocross: '🏍️', archery: '🏹', fencing: '🤺', rugby: '🏉',
  cricket: '🏏', baseball: '⚾', hockey: '🏒',
}

export function suggestEmoji(hobby: string): string | null {
  const lower = hobby.toLowerCase().trim()
  if (!lower || lower.length < 3) return null
  // Exact match
  if (HOBBY_EMOJIS[lower]) return HOBBY_EMOJIS[lower]
  // Key starts with input (e.g. "danc" → "dancing")
  for (const [key, emoji] of Object.entries(HOBBY_EMOJIS)) {
    if (key.startsWith(lower)) return emoji
  }
  // Input starts with key (e.g. "photography" starts with "photo")
  for (const [key, emoji] of Object.entries(HOBBY_EMOJIS)) {
    if (lower.startsWith(key)) return emoji
  }
  return null
}

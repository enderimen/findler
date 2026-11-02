// Oyun sırasında gönderilebilen hazır tepkiler. Anahtarlar sunucudaki REACTION_KINDS ile aynı olmalı.
export interface ReactionOption {
  kind: string;
  label: string;
}

export const EMOJI_REACTIONS: ReactionOption[] = [
  { kind: 'heart', label: '❤️' },
  { kind: 'clap', label: '👏' },
  { kind: 'genius', label: '🧠' },
  { kind: 'party', label: '🎉' },
  { kind: 'fire', label: '🔥' },
  { kind: 'wow', label: '😮' },
];

export const MESSAGE_REACTIONS: ReactionOption[] = [
  { kind: 'super', label: 'Süpersin!' },
  { kind: 'smart', label: 'Zekisin!' },
  { kind: 'memory', label: 'Görsel hafızan çok iyi!' },
  { kind: 'awesome', label: 'Harikasın!' },
  { kind: 'close', label: 'Az kaldı!' },
  { kind: 'respect', label: 'Helal olsun!' },
];

const BY_KIND = new Map([...EMOJI_REACTIONS, ...MESSAGE_REACTIONS].map((r) => [r.kind, r]));

export const reactionLabel = (kind: string) => BY_KIND.get(kind)?.label ?? '';
export const isEmojiReaction = (kind: string) => EMOJI_REACTIONS.some((r) => r.kind === kind);

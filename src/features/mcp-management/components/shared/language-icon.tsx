interface LanguageIconProps {
  language?: string;
  className?: string;
}

const languageEmojis: Record<string, string> = {
  python: '🐍',
  javascript: '📜',
  typescript: '📘',
  go: '🐹',
  rust: '🦀',
  java: '☕',
  other: '📦',
};

export function LanguageIcon({ language, className = 'text-2xl' }: LanguageIconProps) {
  const emoji = languageEmojis[language?.toLowerCase() || 'other'] || languageEmojis.other;

  return <span className={className}>{emoji}</span>;
}

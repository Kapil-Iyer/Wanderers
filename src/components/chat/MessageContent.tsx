"use client";

import { EMOTE_TOKEN_RE, resolvePepeEmote } from "@/lib/pepeEmotes";

/** Renders plain text + :emoteName: shortcodes as Pepe images. */
export function MessageContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  const re = new RegExp(EMOTE_TOKEN_RE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  const trimmed = text.trim();

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={`t-${i++}`}>{text.slice(last, match.index)}</span>);
    }
    const emote = resolvePepeEmote(match[1]);
    if (emote) {
      const alone = trimmed === match[0];
      const size = alone ? 52 : 22;
      nodes.push(
        <img
          key={`e-${i++}`}
          src={emote.url}
          alt={emote.name}
          title={emote.name}
          width={size}
          height={size}
          className="inline-block align-middle mx-0.5"
          style={{ width: size, height: size }}
          draggable={false}
        />
      );
    } else {
      nodes.push(<span key={`t-${i++}`}>{match[0]}</span>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={`t-${i++}`}>{text.slice(last)}</span>);
  }
  if (nodes.length === 0) return <>{text}</>;
  return <>{nodes}</>;
}

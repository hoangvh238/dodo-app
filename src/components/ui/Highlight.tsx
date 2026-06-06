interface Props {
  text: string;
  query?: string;
  className?: string;
}

export default function Highlight({ text, query, className }: Props) {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-400/25 text-amber-200 rounded-[2px] px-[1px] not-italic"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

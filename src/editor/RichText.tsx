import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
export function RichText({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current)
      ref.current.innerHTML = DOMPurify.sanitize(value);
  }, [value]);
  return (
    <div className="rich-editor">
      <div className="format-tools">
        {[
          ["bold", "B"],
          ["italic", "I"],
          ["underline", "U"],
          ["insertUnorderedList", "• Lista"],
          ["formatBlock", "H3"],
        ].map(([command, label]) => (
          <button
            type="button"
            key={command}
            aria-label={command}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              document.execCommand(
                command,
                false,
                command === "formatBlock" ? "h3" : undefined,
              );
              if (ref.current)
                onChange(DOMPurify.sanitize(ref.current.innerHTML));
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Conteúdo de texto rico"
        className="rich-content"
        onInput={(e) => onChange(DOMPurify.sanitize(e.currentTarget.innerHTML))}
        onBlur={(e) => {
          e.currentTarget.innerHTML = DOMPurify.sanitize(
            e.currentTarget.innerHTML,
          );
        }}
      />
    </div>
  );
}

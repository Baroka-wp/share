import { useEffect, useRef, useState } from "react";

const LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function PinInput({
  value,
  onChange,
  error = false,
  disabled = false,
  autoFocus = false,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function updateAt(index: number, char: string) {
    const arr = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");
    arr[index] = char;
    const next = arr.join("").replace(/\s/g, "").slice(0, LENGTH);
    onChange(next);
  }

  function onDigitChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) {
      updateAt(index, "");
      return;
    }
    updateAt(index, digit);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim()) {
      if (index > 0) refs.current[index - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, LENGTH - 1);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className={`pin-boxes ${error ? "pin-boxes--error" : ""}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="pin-box"
          value={d.trim()}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => onDigitChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}

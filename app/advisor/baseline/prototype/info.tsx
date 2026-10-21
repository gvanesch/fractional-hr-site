"use client";
import { useId, useRef, useState } from "react";
export default function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId(),
    ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false),
    [pinned, setPinned] = useState(false);
  return (
    <span
      className="tb-info"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned && document.activeElement !== ref.current) setOpen(false);
      }}
    >
      <button
        ref={ref}
        type="button"
        className="tb-info-button"
        aria-label={"More information: " + label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        aria-controls={id}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setPinned(false);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPinned(!pinned);
          setOpen(!pinned);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setPinned(false);
          }
        }}
      >
        i
      </button>
      {open && (
        <span id={id} role="tooltip" className="tb-info-panel">
          {children}
        </span>
      )}
    </span>
  );
}

"use client";
import { useEffect, useId, useRef, useState } from "react";

export type Option = { value: string; label: string; count?: number; hint?: string };

/**
 * A labelled dropdown that scales to any number of options (a list, not a row of chips).
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter picks, Escape closes.
 */
export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // keep the highlighted option in view
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") return setOpen(false);
    if (e.key === "ArrowDown") setActive((i) => Math.min(options.length - 1, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(options.length - 1);
    else if (e.key === "Enter" || e.key === " ") choose(options[active].value);
    else return;
    e.preventDefault();
  };

  return (
    <div className={`fsel ${open ? "is-open" : ""} ${className}`} ref={root}>
      <button
        type="button"
        className={`fsel__btn ${value !== options[0]?.value ? "is-set" : ""}`}
        role="combobox"
        aria-label={`${label}, ${current?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        <span className="fsel__k">{label}</span>
        <span className="fsel__v">
          {current?.label}
          {current?.count !== undefined && <span className="fsel__n">{current.count}</span>}
        </span>
        <svg className="fsel__chev" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path fill="currentColor" d="M1.4 0 6 4.6 10.6 0 12 1.4l-6 6-6-6z" />
        </svg>
      </button>
      {open && (
        <ul className="fsel__list" id={`${id}-list`} role="listbox" aria-label={label} ref={list}>
          {options.map((o, i) => (
            <li
              key={o.value || "_all"}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`fsel__opt ${i === active ? "is-active" : ""}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              <span className="fsel__tick" aria-hidden="true">
                {o.value === value ? "✓" : ""}
              </span>
              <span className="fsel__text">
                <span>{o.label}</span>
                {o.hint && <span className="fsel__hint">{o.hint}</span>}
              </span>
              {o.count !== undefined && <span className="fsel__n">{o.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

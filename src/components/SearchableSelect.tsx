"use client";

import { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";

export type SearchableSelectOption = { value: string; label: string };

export function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "Search...",
  required = false,
  className = "",
  inputClassName = "",
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const listboxRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? "";

  const filtered =
    query.trim() === ""
      ? options
      : options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && triggerRef.current && typeof document !== "undefined") {
      const updateRect = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownRect({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
        }
      };
      updateRect();
      window.addEventListener("scroll", updateRect, true);
      window.addEventListener("resize", updateRect);
      return () => {
        window.removeEventListener("scroll", updateRect, true);
        window.removeEventListener("resize", updateRect);
      };
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  const handleSelect = (option: SearchableSelectOption) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  const dropdownList = open
    ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={
            dropdownRect
              ? {
                  position: "fixed",
                  top: dropdownRect.top,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                  zIndex: 9999,
                }
              : undefined
          }
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
          ) : (
            filtered.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 ${
                  option.value === value ? "bg-teal-50 text-teal-800" : "text-slate-800"
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )
    : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} readOnly required={required} />
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        id={`${name}-combobox-${listboxId}`}
        className={`relative flex min-h-[38px] w-full cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${inputClassName}`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered[0]) handleSelect(filtered[0]);
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent pr-2 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
            aria-autocomplete="list"
            aria-controls={listboxId}
          />
        ) : (
          <span className={`min-w-0 flex-1 truncate ${value ? "text-slate-900" : "text-slate-500"}`}>
            {displayLabel || placeholder}
          </span>
        )}
        <span
          className="pointer-events-none absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400"
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      {typeof document !== "undefined" && dropdownList && createPortal(dropdownList, document.body)}
    </div>
  );
}

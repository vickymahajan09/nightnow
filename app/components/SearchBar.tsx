"use client";

import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice search is not supported in this browser."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const text =
        event.results?.[0]?.[0]?.transcript || "";

      onChange(text);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  return (
    <section className="bg-white px-3 pb-3 pt-2 text-black">
      <div className="mx-auto max-w-7xl">
        <div
          className={[
            "flex items-center gap-2 rounded-2xl border px-3 transition-all",
            focused
              ? "border-yellow-400 bg-white shadow-md"
              : "border-zinc-200 bg-zinc-100",
          ].join(" ")}
        >
          <span className="text-lg">
            🔍
          </span>

          <input
            type="text"
            value={value}
            onChange={(e) =>
              onChange(e.target.value)
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search medicines, grocery, dairy..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-sm font-black"
            >
              ×
            </button>
          )}

          {/* VOICE SEARCH */}
          <button
            type="button"
            onClick={startVoiceSearch}
            title="Voice Search"
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition",
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-black text-white hover:bg-zinc-800",
            ].join(" ")}
          >
            🎙️
          </button>
        </div>

        {!value && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 text-[11px]">
            {[
              "Medicines",
              "Grocery",
              "Snacks",
              "Dairy",
              "Beverages",
              "Personal Care",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 font-bold text-zinc-600"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
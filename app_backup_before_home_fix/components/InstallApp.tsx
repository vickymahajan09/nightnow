"use client";

import { useEffect, useState } from "react";

export default function InstallApp() {
  const [prompt, setPrompt] =
    useState<any>(null);

  const [show, setShow] =
    useState(false);

  useEffect(() => {
    const handler = (event: any) => {
      event.preventDefault();

      setPrompt(event);
      setShow(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handler
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );
    };
  }, []);

  const install = async () => {
    if (!prompt) {
      return;
    }

    try {
      await prompt.prompt();

      await prompt.userChoice;
    } catch (error) {
      console.error(error);
    }

    setPrompt(null);
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">

      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-2xl text-black">
          ⚡
        </div>

        <div className="flex-1">

          <h3 className="font-bold">
            Install Night Now
          </h3>

          <p className="text-xs text-zinc-400">
            Install app for faster access
          </p>

        </div>

        <button
          onClick={install}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black"
        >
          Install
        </button>

        <button
          onClick={() => setShow(false)}
          className="text-zinc-400"
        >
          ✕
        </button>

      </div>

    </div>
  );
}
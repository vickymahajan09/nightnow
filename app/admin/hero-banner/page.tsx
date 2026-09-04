"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type Slide = {
  title: string;
  sub: string;
};

const EMPTY_SLIDE: Slide = { title: "", sub: "" };

const DEFAULT_SLIDES: Slide[] = [
  { title: "Delivery in\n15 minutes flat", sub: "Fast • Reliable • Night Delivery" },
  { title: "First order\nFREE delivery", sub: "Special offer for new customers" },
  { title: "New deals\nevery day", sub: "Savings on grocery, snacks & daily essentials" },
  { title: "Day or night\nwe've got you", sub: "24x7 fresh groceries, right to your door" },
];

export default function AdminHeroBannerPage() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "heroBanner"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            setSlides(data.slides);
          }
        }
      } catch (error) {
        console.error("Load hero banner error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    setSlides((current) => current.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSlide = () => {
    if (slides.length >= 4) {
      alert("You can have a maximum of 4 slides.");
      return;
    }
    setSlides((current) => [...current, { ...EMPTY_SLIDE }]);
  };

  const removeSlide = (index: number) => {
    setSlides((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const cleanSlides = slides
      .map((s) => ({ title: s.title.trim(), sub: s.sub.trim() }))
      .filter((s) => s.title);

    if (cleanSlides.length === 0) {
      alert("Please enter a title for at least one slide.");
      return;
    }

    try {
      setSaving(true);
      await setDoc(doc(db, "settings", "heroBanner"), { slides: cleanSlides, updatedAt: new Date() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save hero banner error:", error);
      alert("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8">
        <p className="text-sm text-zinc-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black">🎯 Homepage Banner</h1>
        <p className="mt-1 text-sm text-zinc-500">
          These are the slides for the rotating banner at the top of the homepage (max 4). Changes reflect on
          the live website as soon as you save.
        </p>

        <div className="mt-6 space-y-4">
          {slides.map((slide, index) => (
            <div key={index} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black text-zinc-400">SLIDE {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeSlide(index)}
                  className="text-[10px] font-black text-red-500"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={slide.title}
                onChange={(e) => updateSlide(index, "title", e.target.value)}
                placeholder="Title (press Enter for a new line)"
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm outline-none"
              />
              <input
                value={slide.sub}
                onChange={(e) => updateSlide(index, "sub", e.target.value)}
                placeholder="Subtitle"
                className="mt-2 w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addSlide}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black"
          >
            + Add Slide
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Banner"}
          </button>
        </div>
      </div>
    </main>
  );
}

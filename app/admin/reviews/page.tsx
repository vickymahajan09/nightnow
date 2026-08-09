"use client";

import { useEffect, useState } from "react";

import {
  getAllReviews,
  deleteReview,
} from "../../services/reviewService";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await getAllReviews();
      setReviews(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("Delete this review?")) {
      return;
    }

    try {
      await deleteReview(id);

      setReviews((old) =>
        old.filter((review) => review.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to delete review");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading Reviews...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-8">

      <div className="mx-auto max-w-6xl">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Reviews
            </h1>

            <p className="mt-1 text-zinc-400">
              Total Reviews: {reviews.length}
            </p>
          </div>

          <button
            onClick={loadReviews}
            className="rounded-lg bg-zinc-800 px-4 py-2"
          >
            Refresh
          </button>

        </div>

        <div className="mt-8 space-y-4">

          {reviews.map((review: any) => (
            <div
              key={review.id}
              className="rounded-2xl bg-zinc-900 p-5"
            >

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="font-bold">
                    {review.userName}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Product ID: {review.productId}
                  </p>

                </div>

                <p className="text-xl text-yellow-400">
                  {"★".repeat(
                    Number(review.rating || 0)
                  )}
                </p>

              </div>

              <p className="mt-4 text-zinc-300">
                {review.comment}
              </p>

              <div className="mt-5 flex justify-end">

                <button
                  onClick={() =>
                    removeReview(review.id)
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 font-bold"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

          {reviews.length === 0 && (
            <div className="rounded-2xl bg-zinc-900 p-10 text-center text-zinc-500">
              No Reviews Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}
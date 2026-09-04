"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../lib/firebase";

import {
  addReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from "../services/reviewService";

export default function ReviewSection({
  productId,
}: {
  productId: string;
}) {
  const [user, setUser] =
    useState<any>(null);

  const [reviews, setReviews] =
    useState<any[]>([]);

  const [rating, setRating] =
    useState(5);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(
            currentUser
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const loadReviews =
    async () => {
      try {
        setLoading(true);

        const data =
          await getProductReviews(
            productId
          );

        setReviews(data);
      } catch (
        error
      ) {
        console.error(
          "Reviews loading error:",
          error
        );

        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!productId) {
      return;
    }

    loadReviews();
  }, [productId]);

  const submitReview =
    async () => {
      if (!user) {
        alert(
          "Please log in to leave a review."
        );

        return;
      }

      const cleanText =
        text.trim();

      if (!cleanText) {
        alert(
          "Please write a review."
        );

        return;
      }

      try {
        setSaving(true);

        if (editingId) {
          await updateReview(
            editingId,
            rating,
            cleanText
          );
        } else {
          await addReview(
            productId,
            user.uid,
            user.displayName ||
              "Customer",
            rating,
            cleanText
          );
        }

        setText("");
        setRating(5);
        setEditingId("");

        await loadReviews();
      } catch (
        error: any
      ) {
        console.error(
          "Review save error:",
          error
        );

        alert(
          error?.message ||
            "Review save failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const startEdit =
    (review: any) => {
      setEditingId(
        review.id || ""
      );

      setRating(
        Number(
          review.rating || 5
        )
      );

      setText(
        review.comment || ""
      );

      window.scrollTo({
        top:
          document.body.scrollHeight,
        behavior: "smooth",
      });
    };

  const remove =
    async (
      id: string
    ) => {
      if (
        !window.confirm(
          "Delete this review?"
        )
      ) {
        return;
      }

      try {
        await deleteReview(
          id
        );

        setReviews(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id
            )
        );
      } catch (
        error: any
      ) {
        console.error(
          "Review delete error:",
          error
        );

        alert(
          error?.message ||
            "Unable to delete review."
        );
      }
    };

  return (
    <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">
        Reviews
      </h2>

      {user ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-4">

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRating(
                      star
                    )
                  }
                  className="text-2xl"
                >
                  {star <=
                  rating
                    ? "★"
                    : "☆"}
                </button>
              )
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) =>
              setText(
                e.target.value
              )
            }
            rows={4}
            placeholder="Write your review..."
            className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-yellow-400"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                submitReview
              }
              className="flex-1 rounded-xl bg-yellow-400 py-3 text-sm font-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Review"
                  : "Submit Review"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(
                    ""
                  );
                  setText("");
                  setRating(5);
                }}
                className="rounded-xl bg-zinc-200 px-4 text-sm font-black"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
          Login karke review de sakte hain.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-500">
            Loading reviews...
          </p>
        ) : reviews.length ===
          0 ? (
          <p className="rounded-xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">
            No reviews yet.
          </p>
        ) : (
          reviews.map(
            (review) => {
              const ownReview =
                user?.uid ===
                review.userId;

              return (
                <div
                  key={
                    review.id
                  }
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">
                        {review.userName ||
                          "Customer"}
                      </p>

                      <div className="mt-1 text-yellow-500">
                        {"★".repeat(
                          Number(
                            review.rating ||
                              0
                          )
                        )}
                      </div>
                    </div>

                    {ownReview && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              review
                            )
                          }
                          className="text-xs font-black text-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            remove(
                              review.id
                            )
                          }
                          className="text-xs font-black text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-600">
                    {review.comment}
                  </p>
                </div>
              );
            }
          )
        )}
      </div>
    </section>
  );
}
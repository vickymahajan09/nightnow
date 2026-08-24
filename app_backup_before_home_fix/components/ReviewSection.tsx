"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  addReview,
  deleteReview,
  getProductReviews,
} from "../services/reviewService";

type Review = {
  id: string;
  userId: string;
  userName?: string;
  productId?: string;
  rating: number;
  comment?: string;
  createdAt?: any;
};

type Props = {
  productId: string;
};

export default function ReviewSection({
  productId,
}: Props) {
  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [rating, setRating] =
    useState(5);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [userName, setUserName] =
    useState("Customer");

  // ==========================================
  // LOAD REVIEWS
  // ==========================================

  const loadReviews = async () => {
    try {
      setLoading(true);

      const data =
        await getProductReviews(
          productId
        );

      setReviews(
        Array.isArray(data)
          ? (data as Review[])
          : []
      );
    } catch (error) {
      console.error(
        "Reviews loading error:",
        error
      );

      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // AUTH
  // ==========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setUserId(
            user?.uid || null
          );

          if (user) {
            setUserName(
              user.displayName ||
                user.email?.split("@")[0] ||
                "Customer"
            );
          } else {
            setUserName("Customer");
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // LOAD PRODUCT REVIEWS
  // ==========================================

  useEffect(() => {
    loadReviews();
  }, [productId]);

  // ==========================================
  // AVERAGE RATING
  // ==========================================

  const averageRating =
    useMemo(() => {
      if (reviews.length === 0) {
        return 0;
      }

      const total =
        reviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.rating || 0
            ),
          0
        );

      return total / reviews.length;
    }, [reviews]);

  // ==========================================
  // SUBMIT REVIEW
  // ==========================================

  const submitReview = async () => {
    if (!userId) {
      alert(
        "Please login to submit a review."
      );
      return;
    }

    const cleanText =
      text.trim();

    if (!cleanText) {
      alert(
        "Please write your review."
      );
      return;
    }

    if (
      rating < 1 ||
      rating > 5
    ) {
      alert(
        "Please select a rating."
      );
      return;
    }

    try {
      setSubmitting(true);

      await addReview(
        productId,
        userId,
        userName,
        rating,
        cleanText
      );

      setText("");
      setRating(5);

      await loadReviews();
    } catch (error) {
      console.error(
        "Review submit error:",
        error
      );

      alert(
        "Review submit nahi ho paya."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // DELETE REVIEW
  // ==========================================

  const removeReview = async (
    reviewId: string
  ) => {
    if (!userId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this review?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteReview(
        reviewId
      );

      await loadReviews();
    } catch (error) {
      console.error(
        "Review delete error:",
        error
      );

      alert(
        "Review delete nahi ho paya."
      );
    }
  };

  // ==========================================
  // STAR DISPLAY
  // ==========================================

  const renderStars = (
    value: number
  ) => {
    const rounded =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(value)
        )
      );

    return (
      <span>
        <span className="text-yellow-400">
          {"★".repeat(rounded)}
        </span>

        <span className="text-zinc-300">
          {"★".repeat(
            5 - rounded
          )}
        </span>
      </span>
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-xl font-black">
            Ratings & Reviews ⭐
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Customer feedback
          </p>
        </div>

        <div className="rounded-2xl bg-yellow-50 px-5 py-3 text-center">

          <div className="text-2xl font-black">
            {averageRating
              ? averageRating.toFixed(1)
              : "0.0"}
          </div>

          <div className="text-sm">
            {renderStars(
              averageRating
            )}
          </div>

          <div className="mt-1 text-[10px] font-bold text-zinc-500">
            {reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"}
          </div>

        </div>

      </div>

      {/* WRITE REVIEW */}

      {userId ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-4">

          <p className="text-sm font-black">
            Write a review
          </p>

          {/* STAR SELECTOR */}

          <div className="mt-3 flex gap-1">

            {[1, 2, 3, 4, 5].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRating(value)
                  }
                  aria-label={`Rate ${value} stars`}
                  className={`text-2xl transition hover:scale-110 ${
                    value <= rating
                      ? "text-yellow-400"
                      : "text-zinc-300"
                  }`}
                >
                  ★
                </button>
              )
            )}

          </div>

          {/* TEXT */}

          <textarea
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            placeholder="Apna review likhein..."
            rows={4}
            maxLength={1000}
            className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-yellow-400"
          />

          <div className="mt-1 text-right text-[10px] text-zinc-400">
            {text.length}/1000
          </div>

          {/* SUBMIT */}

          <button
            type="button"
            onClick={
              submitReview
            }
            disabled={submitting}
            className="mt-2 rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black text-black transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Submit Review"}
          </button>

        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-5 text-center">

          <div className="text-2xl">
            🔐
          </div>

          <p className="mt-2 text-sm font-black">
            Login to write a review
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Product purchase experience
            share karne ke liye login
            karein.
          </p>

        </div>
      )}

      {/* REVIEWS */}

      <div className="mt-5 space-y-3">

        {loading ? (
          <div className="rounded-2xl bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-400">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-zinc-50 p-6 text-center">

            <div className="text-3xl">
              ⭐
            </div>

            <p className="mt-2 text-sm font-black">
              No reviews yet
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Be the first to review
              this product.
            </p>

          </div>
        ) : (
          reviews.map(
            (review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-zinc-100 bg-white p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black">
                        {review.userName ||
                          "Customer"}
                      </p>

                      <span className="text-[9px] text-zinc-400">
                        •
                      </span>

                      <span className="text-[9px] font-bold text-green-600">
                        Verified
                      </span>
                    </div>

                    <div className="mt-1 text-sm">
                      {renderStars(
                        Number(
                          review.rating ||
                            0
                        )
                      )}
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                      {review.comment ||
                        ""}
                    </p>

                  </div>

                  {userId ===
                    review.userId && (
                    <button
                      type="button"
                      onClick={() =>
                        removeReview(
                          review.id
                        )
                      }
                      className="shrink-0 text-xs font-black text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}

                </div>

              </div>
            )
          )
        )}

      </div>

    </section>
  );
}
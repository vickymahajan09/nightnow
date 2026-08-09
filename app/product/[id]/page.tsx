"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { getProductById } from "../../services/productService";

import {
  addReview,
  getProductReviews,
} from "../../services/reviewService";

import { useCart } from "../../context/CartContext";
import { auth } from "../../lib/firebase";

export default function ProductDetailsPage() {
  const params = useParams();

  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const data: any = await getProductById(
        params.id as string
      );

      setProduct(data);

      if (data) {
        const reviewData =
          await getProductReviews(
            params.id as string
          );

        setReviews(reviewData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please login to write a review");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a review");
      return;
    }

    setReviewLoading(true);

    try {
      await addReview(
        params.id as string,
        user.uid,
        user.email || "Customer",
        rating,
        comment.trim()
      );

      setComment("");
      setRating(5);

      const data =
        await getProductReviews(
          params.id as string
        );

      setReviews(data);

      alert("Review Added Successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to add review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-10 text-center text-white">
        Loading Product...
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black p-10 text-center text-white">
        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>

        <Link href="/">
          <button className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black">
            Back Home
          </button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">

      <div className="mx-auto max-w-5xl">

        <Link href="/">
          <button className="mb-6 rounded-lg bg-zinc-800 px-4 py-2">
            ← Back
          </button>
        </Link>

        <div className="grid gap-10 md:grid-cols-2">

          <div>
            <img
              src={product.image || "/no-image.png"}
              alt={product.name}
              className="w-full rounded-2xl object-cover"
            />
          </div>

          <div>

            <h1 className="text-4xl font-black">
              {product.name}
            </h1>

            <p className="mt-4 text-3xl font-bold text-yellow-400">
              ₹{product.price}
            </p>

            <p className="mt-6 text-zinc-300">
              {product.description}
            </p>

            <p className="mt-6">
              Stock:
              <span className="ml-2 text-green-400">
                {product.stock}
              </span>
            </p>

            {Number(product.stock) > 0 ? (
              <button
                onClick={() =>
                  addToCart({
                    ...product,
                    quantity: 1,
                  })
                }
                className="mt-8 rounded-xl bg-yellow-400 px-8 py-4 font-bold text-black"
              >
                Add To Cart
              </button>
            ) : (
              <button
                disabled
                className="mt-8 rounded-xl bg-zinc-700 px-8 py-4 font-bold text-zinc-400"
              >
                Out of Stock
              </button>
            )}

          </div>
        </div>

        <section className="mt-14">

          <h2 className="text-2xl font-black">
            Customer Reviews
          </h2>

          {reviews.length > 0 ? (
            <div className="mt-6 space-y-4">

              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="rounded-2xl bg-zinc-900 p-5"
                >
                  <div className="flex justify-between">

                    <p className="font-bold">
                      {review.userName}
                    </p>

                    <p className="text-yellow-400">
                      {"★".repeat(
                        Number(review.rating)
                      )}
                    </p>

                  </div>

                  <p className="mt-3 text-zinc-300">
                    {review.comment}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <p className="mt-4 text-zinc-500">
              No reviews yet.
            </p>
          )}

          <div className="mt-8 rounded-2xl bg-zinc-900 p-5">

            <h3 className="text-lg font-bold">
              Write a Review
            </h3>

            {!user ? (
              <Link href="/login">
                <button className="mt-4 rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black">
                  Login to Review
                </button>
              </Link>
            ) : (
              <>
                <div className="mt-4 flex gap-2">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setRating(star)
                        }
                        className={`text-3xl ${
                          star <= rating
                            ? "text-yellow-400"
                            : "text-zinc-600"
                        }`}
                      >
                        ★
                      </button>
                    )
                  )}

                </div>

                <textarea
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  placeholder="Write your review..."
                  rows={4}
                  className="mt-4 w-full rounded-xl bg-zinc-800 p-4 outline-none"
                />

                <button
                  onClick={submitReview}
                  disabled={reviewLoading}
                  className="mt-4 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black disabled:opacity-50"
                >
                  {reviewLoading
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </>
            )}

          </div>

        </section>

      </div>

    </main>
  );
}
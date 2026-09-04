import type { Metadata } from "next";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

import ProductClient from "./ProductClient";

type Props = {
  params: Promise<{ id: string }>;
};

function getProductImage(data: any): string {
  if (Array.isArray(data?.images) && data.images.length > 0) {
    return data.images[0];
  }
  return data?.image || "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const snap = await getDoc(doc(db, "products", id));

    if (!snap.exists()) {
      return { title: "Product Not Found" };
    }

    const data = snap.data();
    const name = data?.name || "Product";
    const price = data?.price;
    const image = getProductImage(data);

    const description =
      `Buy ${name} online on NightNow — delivered in 15 minutes.` +
      (price ? ` Price: ₹${price}.` : "");

    return {
      title: name,
      description,
      openGraph: {
        title: name,
        description,
        images: image ? [{ url: image }] : undefined,
        type: "website",
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: name,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.error("Product generateMetadata error:", error);
    return { title: "Product" };
  }
}

export default function ProductPage() {
  return <ProductClient />;
}

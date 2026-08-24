export type HomeSectionType =
  | "banner"
  | "category-carousel"
  | "product-carousel"
  | "product-grid"
  | "brand-carousel"
  | "offer"
  | "flash-sale"
  | "trending"
  | "best-seller"
  | "new-arrival"
  | "recommended"
  | "discount"
  | "custom";

export type HomeSection = {
  id: string;

  type: HomeSectionType;

  title: string;
  subtitle: string;

  image: string;
  mobileImage: string;
  desktopImage: string;

  products: string[];
  categories: string[];
  brands: string[];

  productLimit: number;

  seeAll: boolean;
  seeAllText: string;
  seeAllUrl: string;

  active: boolean;

  order: number;
  priority: number;

  startDate: string;
  endDate: string;

  createdAt?: any;
  updatedAt?: any;
};

export const HOME_SECTION_TYPES: {
  value: HomeSectionType;
  label: string;
}[] = [
  {
    value: "banner",
    label: "Banner",
  },
  {
    value: "category-carousel",
    label: "Category Carousel",
  },
  {
    value: "product-carousel",
    label: "Product Carousel",
  },
  {
    value: "product-grid",
    label: "Product Grid",
  },
  {
    value: "brand-carousel",
    label: "Brand Carousel",
  },
  {
    value: "offer",
    label: "Offer Section",
  },
  {
    value: "flash-sale",
    label: "Flash Sale",
  },
  {
    value: "trending",
    label: "Trending Products",
  },
  {
    value: "best-seller",
    label: "Best Sellers",
  },
  {
    value: "new-arrival",
    label: "New Arrivals",
  },
  {
    value: "recommended",
    label: "Recommended",
  },
  {
    value: "discount",
    label: "Discount Products",
  },
  {
    value: "custom",
    label: "Custom Collection",
  },
];
"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { getBrands, type Brand } from "../../services/brandService";
import { RETURN_POLICY_OPTIONS } from "../../lib/returnPolicy";

type Variant = {
  id: string;
  label: string;
  unit: string;
  price: string;
  mrp: string;
  stock: string;
};

const MAX_IMAGES = 7;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const newVariant = (): Variant => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  unit: "",
  price: "",
  mrp: "",
  stock: "",
});

const emptyVariants = (): Variant[] => [newVariant()];

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function AddProductPage() {
  // --------------------------------------------------
  // BASIC
  // --------------------------------------------------

  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [genericName, setGenericName] = useState("");

  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // --------------------------------------------------
  // IDENTIFICATION
  // --------------------------------------------------

  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("");

  // --------------------------------------------------
  // PRICE
  // --------------------------------------------------

  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");

  // --------------------------------------------------
  // INVENTORY
  // --------------------------------------------------

  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  // --------------------------------------------------
  // PACK / UNIT
  // --------------------------------------------------

  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("");
  const [packSize, setPackSize] = useState("");

  // --------------------------------------------------
  // DETAILS
  // --------------------------------------------------

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [manufacturer, setManufacturer] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [storage, setStorage] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");

  const [keyFeatures, setKeyFeatures] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [usageInstructions, setUsageInstructions] = useState("");
  const [specifications, setSpecifications] = useState("");

  // --------------------------------------------------
  // SEARCH / DISCOVERY
  // --------------------------------------------------

  const [tags, setTags] = useState("");
  const [keywords, setKeywords] = useState("");

  // --------------------------------------------------
  // IMAGES / VIDEO
  // --------------------------------------------------

  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState("");

  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  // --------------------------------------------------
  // FLAGS
  // --------------------------------------------------

  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [recommended, setRecommended] = useState(false);

  // --------------------------------------------------
  // VARIANTS
  // --------------------------------------------------

  const [variants, setVariants] =
    useState<Variant[]>(emptyVariants());

  // --------------------------------------------------
  // OFFERS
  // --------------------------------------------------

  const [offerType, setOfferType] = useState("NONE");
  const [offerBuyQuantity, setOfferBuyQuantity] = useState("1");
  const [offerFreeQuantity, setOfferFreeQuantity] = useState("0");
  const [offerLabel, setOfferLabel] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerActive, setOfferActive] = useState(false);

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const [uploadingForm, setUploadingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  // --------------------------------------------------
  // LOAD
  // --------------------------------------------------

  useEffect(() => {
    void Promise.all([
      loadCategories(),
      loadBrands(),
      loadProducts(),
    ]);
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();

      setProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Products load error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data =
        await getCategories();

      setCategories(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Categories load error:",
        error
      );

      setCategories([]);
    }
  };

  const loadBrands = async () => {
    try {
      const data =
        await getBrands();

      setBrands(
        Array.isArray(data)
          ? data.filter(
              (brand) =>
                brand.active !== false
            )
          : []
      );
    } catch (error) {
      console.error(
        "Brands load error:",
        error
      );

      setBrands([]);
    }
  };

  // --------------------------------------------------
  // CALCULATED PRICE
  // --------------------------------------------------

  const mrpNumber =
    toNumber(mrp);

  const priceNumber =
    toNumber(price);

  const discount =
    mrpNumber > priceNumber &&
    mrpNumber > 0
      ? Math.round(
          ((mrpNumber -
            priceNumber) /
            mrpNumber) *
            100
        )
      : 0;

  // --------------------------------------------------
  // IMAGE UPLOAD
  // --------------------------------------------------

  const uploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files || []
      );

    event.target.value = "";

    if (!files.length) return;

    const remaining =
      MAX_IMAGES -
      images.length;

    if (remaining <= 0) {
      alert(
        `Maximum ${MAX_IMAGES} images allowed.`
      );
      return;
    }

    const selected =
      files.slice(
        0,
        remaining
      );

    setUploading(true);

    try {
      const uploaded =
        await Promise.all(
          selected.map(
            async (file) => {
              const data =
                new FormData();

              data.append(
                "file",
                file
              );

              data.append(
                "upload_preset",
                "nightnow"
              );

              const response =
                await axios.post(
                  "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
                  data
                );

              return (
                response.data
                  ?.secure_url as
                  | string
                  | undefined
              );
            }
          )
        );

      const urls =
        uploaded.filter(
          Boolean
        ) as string[];

      setImages(
        (current) =>
          [
            ...current,
            ...urls,
          ].slice(
            0,
            MAX_IMAGES
          )
      );

      if (urls.length) {
        alert(
          `${urls.length} image${
            urls.length > 1
              ? "s"
              : ""
          } uploaded successfully.`
        );
      }
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      alert(
        "One or more images failed to upload."
      );
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------
  // VIDEO UPLOAD
  // --------------------------------------------------

  const uploadVideo = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      file.size >
      MAX_VIDEO_SIZE
    ) {
      alert(
        "Video must be smaller than 50 MB."
      );
      return;
    }

    if (
      !file.type.startsWith(
        "video/"
      )
    ) {
      alert(
        "Please select a valid video file."
      );
      return;
    }

    setVideoUploading(true);

    try {
      const data =
        new FormData();

      data.append(
        "file",
        file
      );

      data.append(
        "upload_preset",
        "nightnow"
      );

      const response =
        await axios.post(
          "https://api.cloudinary.com/v1_1/td3xwd7p/video/upload",
          data
        );

      const url =
        response.data
          ?.secure_url;

      if (url) {
        setVideo(url);

        alert(
          "Product video uploaded successfully."
        );
      }
    } catch (error) {
      console.error(
        "Video upload error:",
        error
      );

      alert(
        "Video upload failed."
      );
    } finally {
      setVideoUploading(false);
    }
  };

  const removeImage = (
    index: number
  ) => {
    setImages(
      (current) =>
        current.filter(
          (_, i) =>
            i !== index
        )
    );
  };

  const moveImage = (
    index: number,
    direction: -1 | 1
  ) => {
    setImages(
      (current) => {
        const nextIndex =
          index +
          direction;

        if (
          nextIndex < 0 ||
          nextIndex >=
            current.length
        ) {
          return current;
        }

        const copy =
          [...current];

        [
          copy[index],
          copy[nextIndex],
        ] = [
          copy[nextIndex],
          copy[index],
        ];

        return copy;
      }
    );
  };

  // --------------------------------------------------
  // VARIANTS
  // --------------------------------------------------

  const updateVariant = (
    id: string,
    field: keyof Variant,
    value: string
  ) => {
    setVariants(
      (current) =>
        current.map(
          (variant) =>
            variant.id === id
              ? {
                  ...variant,
                  [field]:
                    value,
                }
              : variant
        )
    );
  };

  const addVariant = () => {
    setVariants(
      (current) => [
        ...current,
        newVariant(),
      ]
    );
  };

  const removeVariant = (
    id: string
  ) => {
    setVariants(
      (current) =>
        current.length === 1
          ? current
          : current.filter(
              (variant) =>
                variant.id !==
                id
            )
    );
  };

  const normalizedVariants =
    useMemo(
      () =>
        variants
          .filter(
            (variant) =>
              variant.label.trim() ||
              variant.price ||
              variant.mrp ||
              variant.stock
          )
          .map(
            (variant) => ({
              id: variant.id,

              name:
                variant.label.trim(),

              size:
                variant.unit.trim()
                  ? `${variant.label.trim()} ${variant.unit.trim()}`.trim()
                  : variant.label.trim(),

              unit:
                variant.unit.trim(),

              price:
                toNumber(
                  variant.price
                ),

              mrp:
                toNumber(
                  variant.mrp ||
                    variant.price
                ),

              stock:
                Math.max(
                  0,
                  Math.floor(
                    toNumber(
                      variant.stock
                    )
                  )
                ),
            })
          ),
      [variants]
    );

  // --------------------------------------------------
  // CLEAR
  // --------------------------------------------------

  const clearForm = () => {
    setName("");
    setMrp("");
    setPrice("");

    setCategory("");
    setSubcategory("");

    setBrandId("");
    setBrandName("");

    setStock("");
    setLowStockThreshold(
      "5"
    );

    setProductType("");
    setGenericName("");

    setSku("");
    setBarcode("");
    setHsn("");
    setGst("");

    setWeight("");
    setUnit("");
    setPackSize("");

    setShortDescription("");
    setDescription("");

    setManufacturer("");
    setCountryOfOrigin("");
    setShelfLife("");
    setPackagingType("");
    setStorage("");
    setReturnPolicy("");
    setMfgDate("");
    setExpDate("");

    setKeyFeatures("");
    setIngredients("");
    setUsageInstructions("");
    setSpecifications("");

    setTags("");
    setKeywords("");

    setImages([]);
    setVideo("");

    setActive(true);
    setFeatured(false);
    setBestSeller(false);
    setNewArrival(false);
    setRecommended(false);

    setVariants(
      emptyVariants()
    );

    setOfferType("NONE");
    setOfferBuyQuantity("1");
    setOfferFreeQuantity("0");
    setOfferLabel("");
    setOfferDescription("");
    setOfferActive(false);

    setEditingId("");
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const saveProduct = async () => {
    if (
      !name.trim() ||
      !price ||
      !category ||
      !images.length
    ) {
      alert(
        "Product name, selling price, category and at least 1 image are required."
      );

      return;
    }

    if (
      priceNumber <= 0
    ) {
      alert(
        "Selling price must be greater than 0."
      );

      return;
    }

    if (
      mrpNumber > 0 &&
      priceNumber >
        mrpNumber
    ) {
      alert(
        "Selling price cannot be greater than MRP."
      );

      return;
    }

    const numericGst =
      gst === ""
        ? 0
        : toNumber(gst);

    if (
      numericGst < 0 ||
      numericGst > 100
    ) {
      alert(
        "GST must be between 0 and 100."
      );

      return;
    }

    const invalidVariant =
      normalizedVariants.find(
        (variant) =>
          variant.mrp > 0 &&
          variant.price >
            variant.mrp
      );

    if (invalidVariant) {
      alert(
        "Variant selling price cannot be greater than its MRP."
      );

      return;
    }

    const normalizedOfferType =
      offerActive && offerType !== "NONE"
        ? offerType
        : "NONE";

    const normalizedOfferBuyQuantity = Math.max(
      1,
      Math.floor(toNumber(offerBuyQuantity, 1))
    );

    const normalizedOfferFreeQuantity = Math.max(
      0,
      Math.floor(toNumber(offerFreeQuantity, 0))
    );

    if (normalizedOfferType !== "NONE" && normalizedOfferFreeQuantity <= 0) {
      alert("Free quantity must be greater than 0 for an active offer.");
      return;
    }

    try {
      setSaving(true);

      const selectedBrand =
        brands.find(
          (brand) =>
            brand.id ===
            brandId
        );

      const finalBrandName =
        selectedBrand?.name ||
        brandName ||
        "";

      const selectedCategoryDoc = categories.find(
        (cat) => cat.id === category.trim()
      );

      const categoryDisplayName =
        selectedCategoryDoc?.name?.trim() || category.trim();

      const product = {
        // BASIC
        name:
          name.trim(),

        productType:
          productType.trim(),

        genericName:
          genericName.trim(),

        // BRAND
        brandId:
          brandId || "",

        brandName:
          finalBrandName,

        brand:
          finalBrandName,

        // CATEGORY
        category:
          categoryDisplayName,

        categoryId:
          category.trim(),

        subcategory:
          subcategory.trim(),

        // IDENTIFICATION
        sku:
          sku.trim(),

        barcode:
          barcode.trim(),

        hsn:
          hsn.trim(),

        gst:
          numericGst,

        // PRICE
        mrp:
          Number(
            mrp || price
          ),

        price:
          Number(price),

        discount,

        // INVENTORY
        stock:
          Math.max(
            0,
            Math.floor(
              toNumber(stock)
            )
          ),

        reservedStock:
          0,

        availableStock:
          Math.max(
            0,
            Math.floor(
              toNumber(stock)
            )
          ),

        lowStockThreshold:
          Math.max(
            0,
            Math.floor(
              toNumber(
                lowStockThreshold
              )
            )
          ),

        // PACK
        weight:
          weight.trim(),

        unit:
          unit.trim(),

        packSize:
          packSize.trim(),

        // DETAILS
        shortDescription:
          shortDescription.trim(),

        description:
          description.trim(),

        manufacturer:
          manufacturer.trim(),

        countryOfOrigin:
          countryOfOrigin.trim(),

        shelfLife:
          shelfLife.trim(),

        packagingType:
          packagingType.trim(),

        storage:
          storage.trim(),

        returnPolicy:
          returnPolicy.trim(),

        mfgDate:
          mfgDate.trim(),

        expDate:
          expDate.trim(),

        keyFeatures:
          keyFeatures.trim(),

        ingredients:
          ingredients.trim(),

        usageInstructions:
          usageInstructions.trim(),

        specifications:
          specifications.trim(),

        // SEARCH
        tags:
          splitCsv(tags),

        keywords:
          splitCsv(keywords),

        // MEDIA
        image:
          images[0],

        images:
          images.slice(
            0,
            MAX_IMAGES
          ),

        video:
          video.trim(),

        // VARIANTS
        variants:
          normalizedVariants,

        sizes:
          normalizedVariants,

        // OFFER
        offerId: "",
        offerType: normalizedOfferType,
        offerBuyQuantity: normalizedOfferType === "NONE" ? 1 : normalizedOfferBuyQuantity,
        offerFreeQuantity: normalizedOfferType === "NONE" ? 0 : normalizedOfferFreeQuantity,
        offerLabel:
          normalizedOfferType === "NONE"
            ? ""
            : offerLabel.trim() || normalizedOfferType,
        offerDescription:
          normalizedOfferType === "NONE"
            ? ""
            : offerDescription.trim(),
        offerActive: normalizedOfferType !== "NONE",

        // FLAGS
        active,

        featured,

        bestSeller,

        newArrival,

        recommended,
      };

      if (editingId) {
        await updateProduct(
          editingId,
          product
        );

        alert(
          "Product updated successfully."
        );
      } else {
        await addProduct(
          product
        );

        alert(
          "Product added successfully."
        );
      }

      clearForm();

      await loadProducts();
    } catch (error) {
      console.error(
        "Save product error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save product.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const editProduct = (
    item: any
  ) => {
    setEditingId(
      item.id
    );

    setName(
      item.name || ""
    );

    setMrp(
      String(
        item.mrp ??
          item.price ??
          ""
      )
    );

    setPrice(
      String(
        item.price ?? ""
      )
    );

    setCategory(
      item.categoryId ||
        item.category ||
        ""
    );

    setSubcategory(
      item.subcategory ||
        ""
    );

    setBrandId(
      item.brandId ||
        ""
    );

    setBrandName(
      item.brandName ||
        item.brand ||
        ""
    );

    setStock(
      String(
        item.stock ?? ""
      )
    );

    setLowStockThreshold(
      String(
        item.lowStockThreshold ??
          "5"
      )
    );

    setProductType(
      item.productType ||
        ""
    );

    setGenericName(
      item.genericName ||
        ""
    );

    setSku(
      item.sku || ""
    );

    setBarcode(
      item.barcode || ""
    );

    setHsn(
      item.hsn || ""
    );

    setGst(
      String(
        item.gst ?? ""
      )
    );

    setWeight(
      item.weight || ""
    );

    setUnit(
      item.unit || ""
    );

    setPackSize(
      item.packSize || ""
    );

    setShortDescription(
      item.shortDescription ||
        ""
    );

    setDescription(
      item.description ||
        ""
    );

    setManufacturer(
      item.manufacturer ||
        ""
    );

    setCountryOfOrigin(
      item.countryOfOrigin ||
        ""
    );

    setShelfLife(
      item.shelfLife ||
        ""
    );

    setPackagingType(
      item.packagingType ||
        ""
    );

    setStorage(
      item.storage || ""
    );

    setReturnPolicy(
      item.returnPolicy ||
        ""
    );

    setMfgDate(
      item.mfgDate || ""
    );

    setExpDate(
      item.expDate || ""
    );

    setKeyFeatures(
      item.keyFeatures ||
        ""
    );

    setIngredients(
      item.ingredients ||
        ""
    );

    setUsageInstructions(
      item.usageInstructions ||
        ""
    );

    setSpecifications(
      item.specifications ||
        ""
    );

    setTags(
      Array.isArray(
        item.tags
      )
        ? item.tags.join(
            ", "
          )
        : item.tags || ""
    );

    setKeywords(
      Array.isArray(
        item.keywords
      )
        ? item.keywords.join(
            ", "
          )
        : item.keywords || ""
    );

    setImages(
      (
        Array.isArray(
          item.images
        )
          ? item.images
          : item.image
            ? [item.image]
            : []
      ).slice(
        0,
        MAX_IMAGES
      )
    );

    setVideo(
      item.video || ""
    );

    setActive(
      item.active !== false
    );

    setFeatured(
      item.featured === true
    );

    setBestSeller(
      item.bestSeller === true
    );

    setNewArrival(
      item.newArrival === true
    );

    setRecommended(
      item.recommended === true
    );

    setOfferType(
      item.offerType || "NONE"
    );

    setOfferBuyQuantity(
      String(item.offerBuyQuantity ?? 1)
    );

    setOfferFreeQuantity(
      String(item.offerFreeQuantity ?? 0)
    );

    setOfferLabel(
      item.offerLabel || ""
    );

    setOfferDescription(
      item.offerDescription || ""
    );

    setOfferActive(
      item.offerActive === true ||
      Boolean(item.offerType && item.offerType !== "NONE")
    );

    const existingVariants =
      Array.isArray(
        item.variants
      )
        ? item.variants
        : Array.isArray(
              item.sizes
            )
          ? item.sizes
          : [];

    setVariants(
      existingVariants.length
        ? existingVariants.map(
            (
              variant: any
            ) => ({
              id:
                String(
                  variant.id ||
                    `${Date.now()}-${Math.random()}`
                ),

              label:
                String(
                  variant.name ||
                    variant.label ||
                    variant.size ||
                    variant.weight ||
                    variant.volume ||
                    ""
                ),

              unit:
                String(
                  variant.unit ||
                    ""
                ),

              price:
                String(
                  variant.price ??
                    ""
                ),

              mrp:
                String(
                  variant.mrp ??
                    variant.price ??
                    ""
                ),

              stock:
                String(
                  variant.stock ??
                    ""
                ),
            })
          )
        : emptyVariants()
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const removeProduct = async (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this product permanently?"
      )
    ) {
      return;
    }

    try {
      await deleteProduct(
        id
      );

      if (
        editingId === id
      ) {
        clearForm();
      }

      await loadProducts();
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      alert(
        "Failed to delete product."
      );
    }
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (item) =>
          [
            item.name,
            item.brandName,
            item.brand,
            item.sku,
            item.barcode,
            item.hsn,
            item.category,
          ]
            .map(
              (value) =>
                String(
                  value || ""
                ).toLowerCase()
            )
            .some(
              (value) =>
                value.includes(
                  query
                )
            )
      );
    }, [
      products,
      search,
    ]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-800 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";

  const labelClass =
    "mb-2 block text-xs font-black text-zinc-600";

  const checkboxClass =
    "h-4 w-4 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-400";

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 text-zinc-800 md:p-7">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-600">
              NightNow Admin
            </p>

            <h1 className="mt-1 text-3xl font-black text-zinc-900">
              {editingId
                ? "Edit Product"
                : "Add Product"}
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Complete product,
              pricing, inventory,
              media and variant
              management.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                clearForm
              }
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-700 shadow-sm hover:bg-yellow-50"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* PRODUCT FORM */}

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          {/* PRICE HEADER */}

          <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-zinc-900">
                Product Information
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Manage the complete
                product record from
                one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {discount > 0 && (
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                  {discount}% OFF
                </span>
              )}

              <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700">
                MRP ₹{mrpNumber}
                {" → "}
                Sale ₹{priceNumber}
              </span>
            </div>
          </div>

          {/* BASIC */}

          <div className="mt-5">

            <h3 className="text-lg font-black text-zinc-900">
              Basic Information
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Product Name *
                </label>

                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Example: Amul Taaza Milk"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Product Type
                </label>

                <input
                  className={inputClass}
                  value={
                    productType
                  }
                  onChange={(e) =>
                    setProductType(
                      e.target.value
                    )
                  }
                  placeholder="Grocery / Dairy / Personal Care"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Generic Name
                </label>

                <input
                  className={inputClass}
                  value={
                    genericName
                  }
                  onChange={(e) =>
                    setGenericName(
                      e.target.value
                    )
                  }
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Brand
                </label>

                <select
                  className={inputClass}
                  value={
                    brandId
                  }
                  onChange={(e) => {
                    const id =
                      e.target
                        .value;

                    setBrandId(id);

                    setBrandName(
                      brands.find(
                        (brand) =>
                          brand.id ===
                          id
                      )?.name ||
                        ""
                    );
                  }}
                >
                  <option value="">
                    Select Brand
                  </option>

                  {brands.map(
                    (brand) => (
                      <option
                        key={
                          brand.id
                        }
                        value={
                          brand.id
                        }
                      >
                        {brand.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Category *
                </label>

                <select
                  className={inputClass}
                  value={
                    category
                  }
                  onChange={(e) =>
                    setCategory(
                      e.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (cat) => (
                      <option
                        key={
                          cat.id
                        }
                        value={
                          cat.id
                        }
                      >
                        {cat.icon ||
                          "📦"}{" "}
                        {cat.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Subcategory
                </label>

                <input
                  className={inputClass}
                  value={
                    subcategory
                  }
                  onChange={(e) =>
                    setSubcategory(
                      e.target.value
                    )
                  }
                  placeholder="Subcategory"
                />
              </div>

            </div>
          </div>

          {/* IDENTIFICATION */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Identification & Tax
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              <div>
                <label className={labelClass}>
                  SKU
                </label>

                <input
                  className={inputClass}
                  value={sku}
                  onChange={(e) =>
                    setSku(
                      e.target.value
                    )
                  }
                  placeholder="NN-001"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Barcode
                </label>

                <input
                  className={inputClass}
                  value={
                    barcode
                  }
                  onChange={(e) =>
                    setBarcode(
                      e.target.value
                    )
                  }
                  placeholder="EAN / UPC"
                />
              </div>

              <div>
                <label className={labelClass}>
                  HSN
                </label>

                <input
                  className={inputClass}
                  value={hsn}
                  onChange={(e) =>
                    setHsn(
                      e.target.value
                    )
                  }
                  placeholder="HSN Code"
                />
              </div>

              <div>
                <label className={labelClass}>
                  GST %
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="100"
                  value={gst}
                  onChange={(e) =>
                    setGst(
                      e.target.value
                    )
                  }
                  placeholder="18"
                />
              </div>

            </div>
          </div>

          {/* PRICING */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Pricing
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <div>
                <label className={labelClass}>
                  MRP
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={mrp}
                  onChange={(e) =>
                    setMrp(
                      e.target.value
                    )
                  }
                  placeholder="60"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Selling Price *
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                  placeholder="50"
                />
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                <p className="text-xs font-bold text-green-700">
                  Automatic Discount
                </p>

                <p className="mt-1 text-2xl font-black text-green-800">
                  {discount}%
                </p>

                <p className="text-[10px] text-green-700">
                  Calculated from MRP
                  and selling price.
                </p>
              </div>

            </div>
          </div>

          {/* INVENTORY */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Inventory
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Stock Quantity
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(
                      e.target.value
                    )
                  }
                  placeholder="100"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Low Stock Threshold
                </label>

                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={
                    lowStockThreshold
                  }
                  onChange={(e) =>
                    setLowStockThreshold(
                      e.target
                        .value
                    )
                  }
                  placeholder="5"
                />
              </div>

            </div>
          </div>

          {/* PACK */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Unit & Pack
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <div>
                <label className={labelClass}>
                  Weight / Quantity
                </label>

                <input
                  className={inputClass}
                  value={
                    weight
                  }
                  onChange={(e) =>
                    setWeight(
                      e.target.value
                    )
                  }
                  placeholder="1"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Unit
                </label>

                <input
                  className={inputClass}
                  value={unit}
                  onChange={(e) =>
                    setUnit(
                      e.target.value
                    )
                  }
                  placeholder="kg / g / ml / L / pcs"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Pack Size
                </label>

                <input
                  className={inputClass}
                  value={
                    packSize
                  }
                  onChange={(e) =>
                    setPackSize(
                      e.target.value
                    )
                  }
                  placeholder="1 litre pack"
                />
              </div>

            </div>
          </div>

          {/* PRODUCT DETAILS */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Product Details
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <input
                className={inputClass}
                value={
                  manufacturer
                }
                onChange={(e) =>
                  setManufacturer(
                    e.target
                      .value
                  )
                }
                placeholder="Manufacturer"
              />

              <input
                className={inputClass}
                value={
                  countryOfOrigin
                }
                onChange={(e) =>
                  setCountryOfOrigin(
                    e.target
                      .value
                  )
                }
                placeholder="Country of Origin"
              />

              <input
                className={inputClass}
                value={
                  shelfLife
                }
                onChange={(e) =>
                  setShelfLife(
                    e.target
                      .value
                  )
                }
                placeholder="Shelf Life"
              />

              <input
                className={inputClass}
                value={
                  packagingType
                }
                onChange={(e) =>
                  setPackagingType(
                    e.target
                      .value
                  )
                }
                placeholder="Packaging Type"
              />

              <input
                className={inputClass}
                value={
                  storage
                }
                onChange={(e) =>
                  setStorage(
                    e.target
                      .value
                  )
                }
                placeholder="Storage Instructions"
              />

              <select
                className={inputClass}
                value={
                  returnPolicy
                }
                onChange={(e) =>
                  setReturnPolicy(
                    e.target
                      .value
                  )
                }
              >
                <option value="">
                  Return / Replacement Policy
                </option>
                {RETURN_POLICY_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.label}
                    >
                      {option.icon}{" "}
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-500">
                  Manufacturing (MFG) Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={
                    mfgDate
                  }
                  onChange={(e) =>
                    setMfgDate(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-500">
                  Expiry (EXP) Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={
                    expDate
                  }
                  onChange={(e) =>
                    setExpDate(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={3}
                value={
                  shortDescription
                }
                onChange={(e) =>
                  setShortDescription(
                    e.target
                      .value
                  )
                }
                placeholder="Short Description"
              />

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={3}
                value={
                  keyFeatures
                }
                onChange={(e) =>
                  setKeyFeatures(
                    e.target
                      .value
                  )
                }
                placeholder="Key Features"
              />

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={3}
                value={
                  ingredients
                }
                onChange={(e) =>
                  setIngredients(
                    e.target
                      .value
                  )
                }
                placeholder="Ingredients"
              />

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={3}
                value={
                  usageInstructions
                }
                onChange={(e) =>
                  setUsageInstructions(
                    e.target
                      .value
                  )
                }
                placeholder="Usage Instructions"
              />

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={3}
                value={
                  specifications
                }
                onChange={(e) =>
                  setSpecifications(
                    e.target
                      .value
                  )
                }
                placeholder="Specifications"
              />

              <textarea
                className={`${inputClass} md:col-span-2`}
                rows={5}
                value={
                  description
                }
                onChange={(e) =>
                  setDescription(
                    e.target
                      .value
                  )
                }
                placeholder="Full Product Description"
              />

            </div>
          </div>

          {/* SEARCH */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Search & Discovery
            </h3>

            <div className="mt-4 grid gap-4">

              <input
                className={inputClass}
                value={tags}
                onChange={(e) =>
                  setTags(
                    e.target.value
                  )
                }
                placeholder="Tags: milk, dairy, amul"
              />

              <input
                className={inputClass}
                value={
                  keywords
                }
                onChange={(e) =>
                  setKeywords(
                    e.target.value
                  )
                }
                placeholder="Search Keywords: amul, milk, 1 litre"
              />

            </div>
          </div>

          {/* FLAGS */}

          <div className="mt-8 border-t border-zinc-100 pt-7">

            <h3 className="text-lg font-black text-zinc-900">
              Product Visibility & Flags
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

              {[
                [
                  "Active",
                  active,
                  setActive,
                ],
                [
                  "Featured",
                  featured,
                  setFeatured,
                ],
                [
                  "Best Seller",
                  bestSeller,
                  setBestSeller,
                ],
                [
                  "New Arrival",
                  newArrival,
                  setNewArrival,
                ],
                [
                  "Recommended",
                  recommended,
                  setRecommended,
                ],
              ].map(
                (item) => (
                  <label
                    key={
                      item[0] as string
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
                  >
                    <input
                      type="checkbox"
                      className={
                        checkboxClass
                      }
                      checked={
                        item[1] as boolean
                      }
                      onChange={(e) =>
                        (
                          item[2] as (
                            value: boolean
                          ) => void
                        )(
                          e.target
                            .checked
                        )
                      }
                    />

                    <span className="text-sm font-black text-zinc-700">
                      {item[0] as string}
                    </span>
                  </label>
                )
              )}

            </div>
          </div>

          {/* OFFERS */}

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50/60 p-4">

            <div>
              <h3 className="text-lg font-black text-zinc-900">
                Product Offer
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Configure a product-level Buy X Get Y offer. The existing CartContext will calculate the free quantity.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Offer Type
                </label>

                <select
                  className={inputClass}
                  value={offerType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOfferType(value);
                    setOfferActive(value !== "NONE");
                    if (value === "BUY_1_GET_1") {
                      setOfferBuyQuantity("1");
                      setOfferFreeQuantity("1");
                    } else if (value === "BUY_1_GET_2") {
                      setOfferBuyQuantity("1");
                      setOfferFreeQuantity("2");
                    } else if (value === "BUY_X_GET_Y") {
                      setOfferBuyQuantity((current) => current || "2");
                      setOfferFreeQuantity((current) => current || "1");
                    }
                  }}
                >
                  <option value="NONE">No Offer</option>
                  <option value="BUY_1_GET_1">Buy 1 Get 1 FREE</option>
                  <option value="BUY_1_GET_2">Buy 1 Get 2 FREE</option>
                  <option value="BUY_X_GET_Y">Buy X Get Y FREE</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={offerActive}
                    onChange={(e) => setOfferActive(e.target.checked)}
                  />
                  <span className="text-sm font-black text-zinc-700">
                    Offer Active
                  </span>
                </label>
              </div>

              <div>
                <label className={labelClass}>
                  Buy Quantity
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={offerBuyQuantity}
                  disabled={offerType === "NONE"}
                  onChange={(e) => setOfferBuyQuantity(e.target.value)}
                  placeholder="Example: 2"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Free Quantity
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={offerFreeQuantity}
                  disabled={offerType === "NONE"}
                  onChange={(e) => setOfferFreeQuantity(e.target.value)}
                  placeholder="Example: 1"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Offer Label
                </label>
                <input
                  className={inputClass}
                  value={offerLabel}
                  disabled={offerType === "NONE"}
                  onChange={(e) => setOfferLabel(e.target.value)}
                  placeholder="Example: Buy 2 Get 1 FREE"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Offer Description
                </label>
                <input
                  className={inputClass}
                  value={offerDescription}
                  disabled={offerType === "NONE"}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder="Example: Buy two units and get one free"
                />
              </div>

            </div>

            {offerType !== "NONE" && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-white p-3 text-xs font-bold text-zinc-600">
                Customer buys <span className="text-zinc-900">{offerBuyQuantity || 1}</span> and gets <span className="text-green-600">{offerFreeQuantity || 0} FREE</span>.
              </div>
            )}
          </div>

          {/* VARIANTS */}

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="font-black text-zinc-900">
                  Variants / Pack Options
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Example: 250 g,
                  500 g, 1 kg,
                  Small, Medium,
                  Large.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addVariant
                }
                className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-zinc-900 hover:bg-yellow-300"
              >
                + Add Variant
              </button>

            </div>

            <div className="mt-4 space-y-3">

              {variants.map(
                (variant, index) => (
                  <div
                    key={
                      variant.id
                    }
                    className="rounded-2xl border border-zinc-200 bg-white p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-500">
                        Variant #
                        {index + 1}
                      </span>

                      {variants.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeVariant(
                              variant.id
                            )
                          }
                          className="text-xs font-black text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                      <input
                        className={
                          inputClass
                        }
                        value={
                          variant.label
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            variant.id,
                            "label",
                            e.target
                              .value
                          )
                        }
                        placeholder="1 / 500 / Large"
                      />

                      <input
                        className={
                          inputClass
                        }
                        value={
                          variant.unit
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            variant.id,
                            "unit",
                            e.target
                              .value
                          )
                        }
                        placeholder="kg / g / ml / pcs"
                      />

                      <input
                        className={
                          inputClass
                        }
                        type="number"
                        min="0"
                        value={
                          variant.mrp
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            variant.id,
                            "mrp",
                            e.target
                              .value
                          )
                        }
                        placeholder="MRP"
                      />

                      <input
                        className={
                          inputClass
                        }
                        type="number"
                        min="0"
                        value={
                          variant.price
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            variant.id,
                            "price",
                            e.target
                              .value
                          )
                        }
                        placeholder="Selling Price"
                      />

                      <input
                        className={
                          inputClass
                        }
                        type="number"
                        min="0"
                        value={
                          variant.stock
                        }
                        onChange={(
                          e
                        ) =>
                          updateVariant(
                            variant.id,
                            "stock",
                            e.target
                              .value
                          )
                        }
                        placeholder="Stock"
                      />

                    </div>
                  </div>
                )
              )}

            </div>
          </div>

          {/* IMAGES */}

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="font-black text-zinc-900">
                  Product Images
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Up to{" "}
                  {MAX_IMAGES}{" "}
                  images. First
                  image is the main
                  image.
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-600 shadow-sm">
                {images.length}/
                {MAX_IMAGES}
              </span>

            </div>

            {images.length <
              MAX_IMAGES && (
              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center transition hover:border-yellow-400 hover:bg-yellow-50">

                <div>
                  <div className="text-3xl">
                    📸
                  </div>

                  <p className="mt-2 text-sm font-black text-zinc-800">
                    {uploading
                      ? "Uploading images..."
                      : "Click to upload images"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    JPG, PNG, WEBP
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    uploading
                  }
                  onChange={
                    uploadImage
                  }
                  className="hidden"
                />

              </label>
            )}

            {images.length >
              0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">

                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={`${image}-${index}`}
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >

                      <div className="relative flex h-32 items-center justify-center bg-white p-2">

                        <img
                          src={image}
                          alt={`Product image ${
                            index + 1
                          }`}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />

                        {index ===
                          0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-yellow-400 px-2 py-1 text-[8px] font-black text-zinc-900">
                            MAIN
                          </span>
                        )}

                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 p-2">

                        <button
                          type="button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              -1
                            )
                          }
                          className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-black disabled:opacity-30"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-500"
                        >
                          ×
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            images.length -
                              1
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              1
                            )
                          }
                          className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-black disabled:opacity-30"
                        >
                          →
                        </button>

                      </div>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* VIDEO */}

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="font-black text-zinc-900">
                  Product Video
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Optional product
                  video. Maximum
                  50 MB.
                </p>
              </div>

              {video && (
                <button
                  type="button"
                  onClick={() =>
                    setVideo("")
                  }
                  className="text-xs font-black text-red-500"
                >
                  Remove
                </button>
              )}

            </div>

            {!video && (
              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center hover:border-yellow-400 hover:bg-yellow-50">

                <div>
                  <div className="text-3xl">
                    🎬
                  </div>

                  <p className="mt-2 text-sm font-black">
                    {videoUploading
                      ? "Uploading video..."
                      : "Upload Product Video"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    MP4 / WEBM /
                    MOV
                  </p>
                </div>

                <input
                  type="file"
                  accept="video/*"
                  disabled={
                    videoUploading
                  }
                  onChange={
                    uploadVideo
                  }
                  className="hidden"
                />

              </label>
            )}

            {video && (
              <video
                src={video}
                controls
                className="mt-4 max-h-72 w-full rounded-2xl bg-black"
              />
            )}

          </div>

          {/* SAVE */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={
                saveProduct
              }
              disabled={
                saving ||
                uploading ||
                videoUploading
              }
              className="flex-1 rounded-2xl bg-yellow-400 py-3.5 text-sm font-black text-zinc-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Save Product"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={
                  clearForm
                }
                className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-black text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            )}

          </div>

        </section>

        {/* PRODUCT LIST */}

        <section className="mt-8">

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-black text-zinc-900">
                Products
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {filteredProducts.length}{" "}
                products
              </p>
            </div>

            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400 md:w-80"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search product, brand, SKU, barcode..."
            />

          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm font-bold text-zinc-500">
              Loading products...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {filteredProducts.map(
                (item) => {
                  const itemImages =
                    Array.isArray(
                      item.images
                    ) &&
                    item.images.length
                      ? item.images
                      : item.image
                        ? [
                            item.image,
                          ]
                        : [];

                  const itemDiscount =
                    toNumber(
                      item.discount
                    ) ||
                    (toNumber(
                      item.mrp
                    ) >
                      toNumber(
                        item.price
                      )
                      ? Math.round(
                          ((toNumber(
                            item.mrp
                          ) -
                            toNumber(
                              item.price
                            )) /
                            toNumber(
                              item.mrp
                            )) *
                            100
                        )
                      : 0);

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                    >

                      <div className="relative flex h-40 items-center justify-center bg-white p-2">

                        <img
                          src={
                            itemImages[0] ||
                            "/no-image.png"
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />

                        {itemDiscount >
                          0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-1 text-[9px] font-black text-white">
                            {
                              itemDiscount
                            }
                            % OFF
                          </span>
                        )}

                      </div>

                      <div className="p-3">

                        <h3 className="line-clamp-2 min-h-10 text-sm font-black text-zinc-900">
                          {
                            item.name
                          }
                        </h3>

                        {(
                          item.brandName ||
                          item.brand
                        ) && (
                          <p className="mt-1 truncate text-xs font-bold text-yellow-700">
                            🏷️{" "}
                            {item.brandName ||
                              item.brand}
                          </p>
                        )}

                        <p className="mt-1 truncate text-[10px] text-zinc-400">
                          SKU:{" "}
                          {item.sku ||
                            "—"}
                        </p>

                        <div className="mt-2 flex items-end justify-between gap-2">

                          <div>
                            <p className="text-base font-black text-zinc-900">
                              ₹
                              {item.price ||
                                0}
                            </p>

                            {toNumber(
                              item.mrp
                            ) >
                              toNumber(
                                item.price
                              ) && (
                              <p className="text-[10px] text-zinc-400 line-through">
                                ₹
                                {
                                  item.mrp
                                }
                              </p>
                            )}
                          </div>

                          <span
                            className={`text-[10px] font-bold ${
                              toNumber(
                                item.stock
                              ) <=
                              toNumber(
                                item.lowStockThreshold ??
                                  5
                              )
                                ? "text-red-500"
                                : "text-zinc-500"
                            }`}
                          >
                            Stock{" "}
                            {item.stock ||
                              0}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">

                          {item.bestSeller && (
                            <span className="rounded-full bg-orange-50 px-2 py-1 text-[8px] font-black text-orange-600">
                              Best Seller
                            </span>
                          )}

                          {item.newArrival && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[8px] font-black text-blue-600">
                              New
                            </span>
                          )}

                          {item.recommended && (
                            <span className="rounded-full bg-purple-50 px-2 py-1 text-[8px] font-black text-purple-600">
                              Recommended
                            </span>
                          )}

                          {item.active ===
                            false && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[8px] font-black text-red-600">
                              Inactive
                            </span>
                          )}

                        </div>

                        {Array.isArray(
                          item.variants
                        ) &&
                          item.variants
                            .length >
                            0 && (
                            <p className="mt-2 text-[10px] font-bold text-green-700">
                              {
                                item
                                  .variants
                                  .length
                              }{" "}
                              size/pack
                              options
                            </p>
                          )}

                        <div className="mt-3 flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              editProduct(
                                item
                              )
                            }
                            className="flex-1 rounded-xl bg-yellow-100 py-2 text-xs font-black text-yellow-800 hover:bg-yellow-200"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeProduct(
                                item.id
                              )
                            }
                            className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-black text-red-500 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}

          {!loading &&
            filteredProducts.length ===
              0 && (
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
                No products found.
              </div>
            )}

        </section>

      </div>
    </main>
  );
}
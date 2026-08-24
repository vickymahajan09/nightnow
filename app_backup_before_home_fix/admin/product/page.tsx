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

type Variant = {
  id: string;
  label: string;
  unit: string;
  price: string;
  mrp: string;
  stock: string;
};

const MAX_IMAGES = 7;

const newVariant = (): Variant => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  unit: "",
  price: "",
  mrp: "",
  stock: "",
});

const emptyVariants = (): Variant[] => [newVariant()];

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  const [productType, setProductType] = useState("");
  const [genericName, setGenericName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("");
  const [packSize, setPackSize] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [storage, setStorage] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [usageInstructions, setUsageInstructions] = useState("");
  const [tags, setTags] = useState("");
  const [keywords, setKeywords] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>(emptyVariants());

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([loadCategories(), loadBrands(), loadProducts()]);
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Products load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Categories load error:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(
        Array.isArray(data)
          ? data.filter((brand) => brand.active !== false)
          : []
      );
    } catch (error) {
      console.error("Brands load error:", error);
      setBrands([]);
    }
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      alert(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const selected = files.slice(0, remaining);
    setUploading(true);

    try {
      // Upload in parallel so 5–7 images do not make the admin page wait
      // through seven sequential network requests.
      const uploaded = await Promise.all(
        selected.map(async (file) => {
          const data = new FormData();
          data.append("file", file);
          data.append("upload_preset", "nightnow");

          const response = await axios.post(
            "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
            data
          );

          return (response.data as any)?.secure_url as string | undefined;
        })
      );

      const urls = uploaded.filter(Boolean) as string[];
      setImages((current) => [...current, ...urls].slice(0, MAX_IMAGES));

      if (urls.length) {
        alert(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded successfully.`);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      alert("One or more images failed to upload. Please retry.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const clearForm = () => {
    setName("");
    setMrp("");
    setPrice("");
    setCategory("");
    setBrandId("");
    setBrandName("");
    setStock("");
    setDescription("");
    setProductType("");
    setGenericName("");
    setSku("");
    setBarcode("");
    setWeight("");
    setUnit("");
    setPackSize("");
    setManufacturer("");
    setCountryOfOrigin("");
    setShelfLife("");
    setPackagingType("");
    setStorage("");
    setReturnPolicy("");
    setKeyFeatures("");
    setIngredients("");
    setUsageInstructions("");
    setTags("");
    setKeywords("");
    setImages([]);
    setVariants(emptyVariants());
    setEditingId("");
  };

  const mrpNumber = Number(mrp || 0);
  const priceNumber = Number(price || 0);
  const discount =
    mrpNumber > priceNumber && mrpNumber > 0
      ? Math.round(((mrpNumber - priceNumber) / mrpNumber) * 100)
      : 0;

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addVariant = () => setVariants((current) => [...current, newVariant()]);

  const removeVariant = (id: string) => {
    setVariants((current) =>
      current.length === 1 ? current : current.filter((variant) => variant.id !== id)
    );
  };

  const normalizedVariants = useMemo(
    () =>
      variants
        .filter((variant) => variant.label.trim() || variant.price || variant.mrp || variant.stock)
        .map((variant) => ({
          id: variant.id,
          name: variant.label.trim(),
          size: variant.unit.trim() ? `${variant.label.trim()} ${variant.unit.trim()}`.trim() : variant.label.trim(),
          unit: variant.unit.trim(),
          price: Number(variant.price || 0),
          mrp: Number(variant.mrp || variant.price || 0),
          stock: Number(variant.stock || 0),
        })),
    [variants]
  );

  const saveProduct = async () => {
    if (!name.trim() || !price || !category || !images.length) {
      alert("Product name, selling price, category and at least 1 image are required.");
      return;
    }

    if (mrpNumber > 0 && priceNumber > mrpNumber) {
      alert("Selling price cannot be greater than MRP.");
      return;
    }

    const invalidVariant = normalizedVariants.find(
      (variant) => variant.mrp > 0 && variant.price > variant.mrp
    );
    if (invalidVariant) {
      alert("Variant selling price cannot be greater than its MRP.");
      return;
    }

    try {
      setSaving(true);

      const selectedBrand = brands.find((brand) => brand.id === brandId);
      const finalBrandName = selectedBrand?.name || brandName || "";

      const product = {
        name: name.trim(),
        mrp: Number(mrp || price),
        price: Number(price),
        category,
        brandId: brandId || "",
        brandName: finalBrandName,
        brand: finalBrandName,
        stock: Number(stock || 0),
        description: description.trim(),
        productType: productType.trim(),
        genericName: genericName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        weight: weight.trim(),
        unit: unit.trim(),
        packSize: packSize.trim(),
        manufacturer: manufacturer.trim(),
        countryOfOrigin: countryOfOrigin.trim(),
        shelfLife: shelfLife.trim(),
        packagingType: packagingType.trim(),
        storage: storage.trim(),
        returnPolicy: returnPolicy.trim(),
        keyFeatures: keyFeatures.trim(),
        ingredients: ingredients.trim(),
        usageInstructions: usageInstructions.trim(),
        tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
        keywords: keywords.split(",").map((item) => item.trim()).filter(Boolean),
        image: images[0],
        images: images.slice(0, MAX_IMAGES),
        variants: normalizedVariants,
        sizes: normalizedVariants,
        discount,
      };

      if (editingId) {
        await updateProduct(editingId, product);
        alert("Product updated successfully.");
      } else {
        await addProduct(product);
        alert("Product added successfully.");
      }

      clearForm();
      await loadProducts();
    } catch (error) {
      console.error("Save product error:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (item: any) => {
    setEditingId(item.id);
    setName(item.name || "");
    setMrp(String(item.mrp ?? item.price ?? ""));
    setPrice(String(item.price ?? ""));
    setCategory(item.category || "");
    setBrandId(item.brandId || "");
    setBrandName(item.brandName || item.brand || "");
    setStock(String(item.stock ?? ""));
    setDescription(item.description || "");
    setProductType(item.productType || "");
    setGenericName(item.genericName || "");
    setSku(item.sku || "");
    setBarcode(item.barcode || "");
    setWeight(item.weight || "");
    setUnit(item.unit || "");
    setPackSize(item.packSize || "");
    setManufacturer(item.manufacturer || "");
    setCountryOfOrigin(item.countryOfOrigin || "");
    setShelfLife(item.shelfLife || "");
    setPackagingType(item.packagingType || "");
    setStorage(item.storage || "");
    setReturnPolicy(item.returnPolicy || "");
    setKeyFeatures(item.keyFeatures || "");
    setIngredients(item.ingredients || "");
    setUsageInstructions(item.usageInstructions || "");
    setTags(Array.isArray(item.tags) ? item.tags.join(", ") : item.tags || "");
    setKeywords(Array.isArray(item.keywords) ? item.keywords.join(", ") : item.keywords || "");

    const existingImages = Array.isArray(item.images)
      ? item.images
      : item.image
        ? [item.image]
        : [];
    setImages(existingImages.slice(0, MAX_IMAGES));

    const existingVariants = Array.isArray(item.variants)
      ? item.variants
      : Array.isArray(item.sizes)
        ? item.sizes
        : [];

    setVariants(
      existingVariants.length
        ? existingVariants.map((variant: any) => ({
            id: String(variant.id || `${Date.now()}-${Math.random()}`),
            label: String(variant.name || variant.label || variant.size || variant.weight || variant.volume || ""),
            unit: String(variant.unit || ""),
            price: String(variant.price ?? ""),
            mrp: String(variant.mrp ?? variant.price ?? ""),
            stock: String(variant.stock ?? ""),
          }))
        : emptyVariants()
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Failed to delete product.");
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) =>
      [item.name, item.brandName, item.brand, item.sku, item.barcode]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [products, search]);

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-800 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";
  const labelClass = "mb-2 block text-xs font-black text-zinc-600";

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 text-zinc-800 md:p-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-600">Night Now Admin</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-900">{editingId ? "Edit Product" : "Add Product"}</h1>
            <p className="mt-1 text-sm text-zinc-500">Complete product, variant and image management.</p>
          </div>
          {editingId && (
            <button onClick={clearForm} className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-700 shadow-sm hover:bg-yellow-50">
              Cancel Edit
            </button>
          )}
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900">Product Information</h2>
              <p className="mt-1 text-xs text-zinc-500">Fields are saved directly to the product document.</p>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">{discount}% OFF</span>
                <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700">MRP ₹{mrpNumber} → Sale ₹{priceNumber}</span>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Product Name *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: Amul Taaza Milk" />
            </div>
            <div>
              <label className={labelClass}>MRP</label>
              <input className={inputClass} type="number" min="0" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="60" />
            </div>
            <div>
              <label className={labelClass}>Selling Price *</label>
              <input className={inputClass} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="400" />
              {mrpNumber > priceNumber && (
                <p className="mt-1 text-[10px] font-bold text-green-600">
                  Home page badge: {discount}% OFF · MRP ₹{mrpNumber} · Sale ₹{priceNumber}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <select className={inputClass} value={brandId} onChange={(e) => { setBrandId(e.target.value); setBrandName(brands.find((brand) => brand.id === e.target.value)?.name || ""); }}>
                <option value="">Select Brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon || "📦"} {cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input className={inputClass} type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className={labelClass}>Product Type</label>
              <input className={inputClass} value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Grocery / Dairy / Personal Care" />
            </div>
            <div>
              <label className={labelClass}>Generic Name</label>
              <input className={inputClass} value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className={labelClass}>SKU</label>
              <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="NN-001" />
            </div>
            <div>
              <label className={labelClass}>Barcode</label>
              <input className={inputClass} value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="EAN / UPC" />
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-yellow-100 bg-yellow-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-zinc-900">Sizes / Pack Variants</h3>
                <p className="mt-1 text-xs text-zinc-500">Add 500 ml, 1 L, 1 kg, 2 kg, 5 kg or any custom pack.</p>
              </div>
              <button type="button" onClick={addVariant} className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-zinc-900 shadow-sm hover:bg-yellow-300">+ Add Size</button>
            </div>

            <div className="mt-4 space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-500">Variant {index + 1}</span>
                    {variants.length > 1 && <button type="button" onClick={() => removeVariant(variant.id)} className="text-xs font-black text-red-500 hover:text-red-600">Remove</button>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <input className={inputClass} value={variant.label} onChange={(e) => updateVariant(variant.id, "label", e.target.value)} placeholder="1 / 500 / Large" />
                    <input className={inputClass} value={variant.unit} onChange={(e) => updateVariant(variant.id, "unit", e.target.value)} placeholder="kg / g / ml / L / pcs" />
                    <input className={inputClass} type="number" min="0" value={variant.mrp} onChange={(e) => updateVariant(variant.id, "mrp", e.target.value)} placeholder="MRP" />
                    <input className={inputClass} type="number" min="0" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} placeholder="Selling Price" />
                    <input className={inputClass} type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} placeholder="Stock" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-zinc-900">Product Images</h3>
                <p className="mt-1 text-xs text-zinc-500">Upload up to {MAX_IMAGES} images. First image is the main image.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-600 shadow-sm">{images.length}/{MAX_IMAGES}</span>
            </div>

            {images.length < MAX_IMAGES && (
              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center transition hover:border-yellow-400 hover:bg-yellow-50">
                <div>
                  <div className="text-3xl">📸</div>
                  <p className="mt-2 text-sm font-black text-zinc-800">{uploading ? "Uploading images..." : "Click to upload 1–7 images"}</p>
                  <p className="mt-1 text-xs text-zinc-400">JPG, PNG, WEBP</p>
                </div>
                <input type="file" accept="image/*" multiple disabled={uploading} onChange={uploadImage} className="hidden" />
              </label>
            )}

            {images.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="relative flex h-32 items-center justify-center bg-white p-2">
                      <img src={image} alt={`Product image ${index + 1}`} loading="lazy" className="h-full w-full object-contain" />
                      {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-yellow-400 px-2 py-1 text-[8px] font-black text-zinc-900">MAIN</span>}
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 p-2">
                      <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-black disabled:opacity-30">←</button>
                      <button type="button" onClick={() => removeImage(index)} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-500">×</button>
                      <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-black disabled:opacity-30">→</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-7">
            <h3 className="text-lg font-black text-zinc-900">Product Details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className={inputClass} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Net Weight / Quantity" />
              <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit: kg / g / ml / L / pcs" />
              <input className={inputClass} value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder="Pack Size" />
              <input className={inputClass} value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Manufacturer" />
              <input className={inputClass} value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} placeholder="Country of Origin" />
              <input className={inputClass} value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} placeholder="Shelf Life" />
              <input className={inputClass} value={packagingType} onChange={(e) => setPackagingType(e.target.value)} placeholder="Packaging Type" />
              <input className={inputClass} value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="Storage Instructions" />
              <input className={inputClass} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Return / Replacement Policy" />
              <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags: milk, dairy, amul" />
              <input className={`${inputClass} md:col-span-2`} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Search Keywords: amul, milk, 1 litre" />
              <textarea className={`${inputClass} md:col-span-2`} rows={3} value={keyFeatures} onChange={(e) => setKeyFeatures(e.target.value)} placeholder="Key Features" />
              <textarea className={`${inputClass} md:col-span-2`} rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients" />
              <textarea className={`${inputClass} md:col-span-2`} rows={3} value={usageInstructions} onChange={(e) => setUsageInstructions(e.target.value)} placeholder="Usage Instructions" />
              <textarea className={`${inputClass} md:col-span-2`} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full Product Description" />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={saveProduct} disabled={saving || uploading} className="flex-1 rounded-2xl bg-yellow-400 py-3.5 text-sm font-black text-zinc-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
            </button>
            {editingId && <button type="button" onClick={clearForm} className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-black text-zinc-700 hover:bg-zinc-50">Cancel</button>}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900">Products</h2>
              <p className="mt-1 text-xs text-zinc-500">{filteredProducts.length} products</p>
            </div>
            <input className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400 md:w-80" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, brand, SKU..." />
          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm font-bold text-zinc-500">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((item) => {
                const itemImages = Array.isArray(item.images) && item.images.length ? item.images : item.image ? [item.image] : [];
                return (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex h-40 items-center justify-center bg-white p-2">
                      <img src={itemImages[0] || "/no-image.png"} alt={item.name || "Product"} loading="lazy" className="h-full w-full object-contain" />
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-black text-zinc-900">{item.name}</h3>
                      {(item.brandName || item.brand) && <p className="mt-1 truncate text-xs font-bold text-yellow-700">🏷️ {item.brandName || item.brand}</p>}
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-base font-black text-zinc-900">₹{item.price || 0}</p>
                          {item.mrp > item.price && <p className="text-[10px] text-zinc-400 line-through">₹{item.mrp}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500">Stock {item.stock || 0}</span>
                      </div>
                      {Array.isArray(item.variants) && item.variants.length > 0 && <p className="mt-2 text-[10px] font-bold text-green-700">{item.variants.length} size/pack options</p>}
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => editProduct(item)} className="flex-1 rounded-xl bg-yellow-100 py-2 text-xs font-black text-yellow-800 hover:bg-yellow-200">Edit</button>
                        <button type="button" onClick={() => removeProduct(item.id)} className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-black text-red-500 hover:bg-red-100">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">No products found.</div>}
        </section>
      </div>
    </main>
  );
}

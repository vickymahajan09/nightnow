import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export type ImportRow = {
  rowNumber: number;
  brand: string;
  productName: string;
  category: string;
  subcategory: string;
  sku: string;
  barcode: string;
  mrp: number;
  salePrice: number;
  discount: number;
  unit: string;
  packSize: string;
  weight: string;
  stock: number;
  gst: number;
  hsn: string;
  description: string;
  shortDescription: string;
  productImageFilename: string;
  brandImageFilename: string;
  [key: string]: any;
};

export type ImportError = {
  rowNumber: number;
  sku: string;
  productName: string;
  errors: string[];
};

export type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  errors: ImportError[];
};

const clean = (value: unknown): string =>
  String(value ?? "").trim();

const normalize = (value: unknown): string =>
  clean(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

export const normalizeFilename = (
  filename: unknown
): string => {
  const value = clean(filename);

  if (!value) return "";

  const parts = value.split(/[\\/]/g);

  return String(parts[parts.length - 1] ?? "")
    .toLowerCase()
    .trim();
};

const numberValue = (
  value: unknown,
  fallback = 0
): number => {
  const n = Number(
    clean(value)
      .replace(/,/g, "")
      .replace(/₹/g, "")
  );

  return Number.isFinite(n)
    ? n
    : fallback;
};

const calculateDiscount = (
  mrp: number,
  price: number
): number => {
  if (
    mrp <= 0 ||
    price <= 0 ||
    price >= mrp
  ) {
    return 0;
  }

  return Math.round(
    ((mrp - price) / mrp) * 100
  );
};

type FirestoreRecord = {
  id: string;
  name?: string;
  logo?: string;
  image?: string;
  active?: boolean;
  [key: string]: any;
};

const findByName = async (
  collectionName: string,
  name: string
): Promise<FirestoreRecord | null> => {
  const value = clean(name);

  if (!value) return null;

  try {
    const result = await getDocs(
      query(
        collection(db, collectionName),
        where("nameLower", "==", normalize(value)),
        limit(1)
      )
    );

    if (!result.empty) {
      const item = result.docs[0];

      return {
        id: item.id,
        ...item.data(),
      };
    }
  } catch {
    // Fallback below.
  }

  const snapshot = await getDocs(
    collection(db, collectionName)
  );

  const found = snapshot.docs.find(
    (item) =>
      normalize(item.data()?.name) ===
      normalize(value)
  );

  if (!found) return null;

  return {
    id: found.id,
    ...found.data(),
  };
};

const findBrand = async (
  name: string
): Promise<FirestoreRecord | null> => {
  return findByName("brands", name);
};

const findCategory = async (
  name: string
): Promise<FirestoreRecord | null> => {
  return findByName("categories", name);
};

const createBrand = async (
  name: string,
  image = ""
): Promise<FirestoreRecord | null> => {
  const cleanName = clean(name);

  if (!cleanName) return null;

  const existing = await findBrand(cleanName);

  if (existing) {
    return existing;
  }

  const ref = await addDoc(
    collection(db, "brands"),
    {
      name: cleanName,
      nameLower: normalize(cleanName),
      logo: image,
      image,
      active: true,
      topBrand: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  return {
    id: ref.id,
    name: cleanName,
    logo: image,
    image,
    active: true,
  };
};

const findProductBySku = async (
  sku: string
): Promise<FirestoreRecord | null> => {
  const value = clean(sku);

  if (!value) return null;

  try {
    const result = await getDocs(
      query(
        collection(db, "products"),
        where("skuLower", "==", normalize(value)),
        limit(1)
      )
    );

    if (!result.empty) {
      const item = result.docs[0];

      return {
        id: item.id,
        ...item.data(),
      };
    }
  } catch {
    // Fallback below.
  }

  return null;
};

const findProductByBarcode = async (
  barcode: string
): Promise<FirestoreRecord | null> => {
  const value = clean(barcode);

  if (!value) return null;

  try {
    const result = await getDocs(
      query(
        collection(db, "products"),
        where(
          "barcodeLower",
          "==",
          normalize(value)
        ),
        limit(1)
      )
    );

    if (!result.empty) {
      const item = result.docs[0];

      return {
        id: item.id,
        ...item.data(),
      };
    }
  } catch {
    // Fallback below.
  }

  return null;
};

export const normalizeImportRow = (
  raw: Record<string, any>,
  rowNumber: number
): ImportRow => {
  const productName = clean(
    raw["Product Name"] ??
      raw.productName ??
      raw.name
  );

  const brand = clean(
    raw.Brand ?? raw.brand
  );

  const category = clean(
    raw.Category ?? raw.category
  );

  const subcategory = clean(
    raw.Subcategory ??
      raw.subcategory
  );

  const sku = clean(
    raw.SKU ?? raw.sku
  );

  const barcode = clean(
    raw.Barcode ?? raw.barcode
  );

  const mrp = numberValue(
    raw.MRP ?? raw.mrp
  );

  const salePrice = numberValue(
    raw["Sale Price"] ??
      raw.salePrice ??
      raw.price
  );

  const suppliedDiscount =
    numberValue(
      raw.Discount ??
        raw.discount
    );

  return {
    rowNumber,
    brand,
    productName,
    category,
    subcategory,
    sku,
    barcode,
    mrp,
    salePrice,
    discount:
      suppliedDiscount ||
      calculateDiscount(
        mrp,
        salePrice
      ),
    unit: clean(
      raw.Unit ?? raw.unit
    ),
    packSize: clean(
      raw["Pack Size"] ??
        raw.packSize
    ),
    weight: clean(
      raw.Weight ?? raw.weight
    ),
    stock: numberValue(
      raw.Stock ?? raw.stock
    ),
    gst: numberValue(
      raw.GST ?? raw.gst
    ),
    hsn: clean(
      raw.HSN ?? raw.hsn
    ),
    description: clean(
      raw.Description ??
        raw.description
    ),
    shortDescription: clean(
      raw["Short Description"] ??
        raw.shortDescription
    ),
    productImageFilename: clean(
      raw["Product Image Filename"] ??
        raw.productImageFilename ??
        raw.image
    ),
    brandImageFilename: clean(
      raw["Brand Image Filename"] ??
        raw.brandImageFilename ??
        raw.brandImage
    ),
  };
};

const validateRow = (
  row: ImportRow
): string[] => {
  const errors: string[] = [];

  if (!row.productName) {
    errors.push("Product Name missing");
  }

  if (!row.brand) {
    errors.push("Brand missing");
  }

  if (!row.category) {
    errors.push("Category missing");
  }

  if (!row.sku) {
    errors.push("SKU missing");
  }

  if (row.mrp <= 0) {
    errors.push("Invalid MRP");
  }

  if (row.salePrice <= 0) {
    errors.push("Invalid Sale Price");
  }

  if (
    row.mrp > 0 &&
    row.salePrice > row.mrp
  ) {
    errors.push(
      "Sale Price greater than MRP"
    );
  }

  if (row.stock < 0) {
    errors.push("Invalid Stock");
  }

  if (
    row.gst < 0 ||
    row.gst > 100
  ) {
    errors.push("Invalid GST");
  }

  return errors;
};

export const validateImportRows = (
  rows: ImportRow[]
): ImportError[] => {
  const errors: ImportError[] = [];

  const seenSku =
    new Set<string>();

  const seenBarcode =
    new Set<string>();

  for (const row of rows) {
    const rowErrors =
      validateRow(row);

    const skuKey =
      normalize(row.sku);

    const barcodeKey =
      normalize(row.barcode);

    if (
      skuKey &&
      seenSku.has(skuKey)
    ) {
      rowErrors.push(
        "Duplicate SKU inside Excel"
      );
    }

    if (skuKey) {
      seenSku.add(skuKey);
    }

    if (
      barcodeKey &&
      seenBarcode.has(
        barcodeKey
      )
    ) {
      rowErrors.push(
        "Duplicate Barcode inside Excel"
      );
    }

    if (barcodeKey) {
      seenBarcode.add(
        barcodeKey
      );
    }

    if (rowErrors.length) {
      errors.push({
        rowNumber:
          row.rowNumber,
        sku: row.sku,
        productName:
          row.productName,
        errors: rowErrors,
      });
    }
  }

  return errors;
};

export const importProducts = async ({
  rows,
  imageMap,
  brandImageMap,
  createMissingBrands,
  requireExistingCategories,
  updateExisting,
}: {
  rows: ImportRow[];
  imageMap: Map<string, string>;
  brandImageMap: Map<string, string>;
  createMissingBrands: boolean;
  requireExistingCategories: boolean;
  updateExisting: boolean;
}): Promise<ImportResult> => {
  let created = 0;
  let updated = 0;

  const errors: ImportError[] = [];

  const productsSnapshot =
    await getDocs(
      collection(db, "products")
    );

  const existingSkuIds =
    new Map<string, string>();

  const existingBarcodeIds =
    new Map<string, string>();

  productsSnapshot.docs.forEach(
    (item) => {
      const data =
        item.data();

      const skuKey =
        normalize(data.sku);

      const barcodeKey =
        normalize(data.barcode);

      if (skuKey) {
        existingSkuIds.set(
          skuKey,
          item.id
        );
      }

      if (barcodeKey) {
        existingBarcodeIds.set(
          barcodeKey,
          item.id
        );
      }
    }
  );

  let batch =
    writeBatch(db);

  let batchCount = 0;

  const commitBatch =
    async () => {
      if (batchCount === 0) {
        return;
      }

      await batch.commit();

      batch =
        writeBatch(db);

      batchCount = 0;
    };

  for (const row of rows) {
    try {
      const rowErrors =
        validateRow(row);

      if (rowErrors.length) {
        errors.push({
          rowNumber:
            row.rowNumber,
          sku: row.sku,
          productName:
            row.productName,
          errors: rowErrors,
        });

        continue;
      }

      let brand =
        await findBrand(
          row.brand
        );

      if (!brand) {
        if (
          !createMissingBrands
        ) {
          throw new Error(
            `Brand not found: ${row.brand}`
          );
        }

        const brandImage =
          brandImageMap.get(
            normalizeFilename(
              row.brandImageFilename
            )
          ) || "";

        brand =
          await createBrand(
            row.brand,
            brandImage
          );
      }

      if (!brand) {
        throw new Error(
          `Unable to create brand: ${row.brand}`
        );
      }

      const category =
        await findCategory(
          row.category
        );

      if (
        !category &&
        requireExistingCategories
      ) {
        throw new Error(
          `Category not found: ${row.category}`
        );
      }

      const productImage =
        imageMap.get(
          normalizeFilename(
            row.productImageFilename
          )
        ) || "";

      if (
        row.productImageFilename &&
        !productImage
      ) {
        throw new Error(
          `Product image not found: ${row.productImageFilename}`
        );
      }

      const existingBySku =
        existingSkuIds.get(
          normalize(row.sku)
        );

      const existingByBarcode =
        existingBarcodeIds.get(
          normalize(row.barcode)
        );

      const existingId =
        existingBySku ||
        existingByBarcode ||
        "";

      if (
        existingId &&
        !updateExisting
      ) {
        throw new Error(
          "Product already exists. Enable Update Existing Products."
        );
      }

      const brandId =
        String(
          brand.id || ""
        );

      const brandName =
        String(
          brand.name ||
            row.brand
        );

      const productData = {
        name:
          row.productName,

        nameLower:
          normalize(
            row.productName
          ),

        brandId,

        brandName,

        brand:
          brandName,

        category:
          row.category,

        categoryId:
          String(
            category?.id || ""
          ),

        subcategory:
          row.subcategory,

        sku:
          row.sku,

        skuLower:
          normalize(row.sku),

        barcode:
          row.barcode,

        barcodeLower:
          normalize(
            row.barcode
          ),

        mrp:
          row.mrp,

        price:
          row.salePrice,

        discount:
          calculateDiscount(
            row.mrp,
            row.salePrice
          ),

        unit:
          row.unit,

        packSize:
          row.packSize,

        weight:
          row.weight,

        stock:
          Math.max(
            0,
            Math.floor(
              row.stock
            )
          ),

        reservedStock:
          0,

        availableStock:
          Math.max(
            0,
            Math.floor(
              row.stock
            )
          ),

        gst:
          row.gst,

        hsn:
          row.hsn,

        description:
          row.description,

        shortDescription:
          row.shortDescription,

        image:
          productImage,

        images:
          productImage
            ? [productImage]
            : [],

        active:
          true,

        importedFromExcel:
          true,

        updatedAt:
          new Date(),
      };

      if (existingId) {
        batch.update(
          doc(
            db,
            "products",
            existingId
          ),
          productData
        );

        updated++;
      } else {
        const productRef =
          doc(
            collection(
              db,
              "products"
            )
          );

        batch.set(
          productRef,
          {
            ...productData,
            createdAt:
              new Date(),
          }
        );

        created++;

        existingSkuIds.set(
          normalize(row.sku),
          productRef.id
        );

        if (row.barcode) {
          existingBarcodeIds.set(
            normalize(
              row.barcode
            ),
            productRef.id
          );
        }
      }

      batchCount++;

      if (batchCount >= 400) {
        await commitBatch();
      }
    } catch (error) {
      errors.push({
        rowNumber:
          row.rowNumber,
        sku: row.sku,
        productName:
          row.productName,
        errors: [
          error instanceof Error
            ? error.message
            : "Unknown import error",
        ],
      });
    }
  }

  await commitBatch();

  return {
    created,
    updated,
    failed:
      errors.length,
    errors,
  };
};

export const saveImportHistory =
  async (
    result: ImportResult,
    filename: string
  ) => {
    await addDoc(
      collection(
        db,
        "importHistory"
      ),
      {
        type:
          "product_excel_import",

        filename,

        created:
          result.created,

        updated:
          result.updated,

        failed:
          result.failed,

        errors:
          result.errors.slice(
            0,
            200
          ),

        createdAt:
          new Date(),
      }
    );
  };
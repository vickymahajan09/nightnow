"use client";

import {
  useMemo,
  useState,
} from "react";

import * as XLSX from "xlsx";
import JSZip from "jszip";

import {
  importProducts,
  normalizeFilename,
  normalizeImportRow,
  saveImportHistory,
  validateImportRows,
  type ImportError,
  type ImportRow,
  type ImportResult,
} from "../../services/excelImportService";

type ImageFile = {
  name: string;
  file: File;
};

const TEMPLATE_HEADERS = [
  "Brand",
  "Product Name",
  "Category",
  "Subcategory",
  "SKU",
  "Barcode",
  "MRP",
  "Sale Price",
  "Discount",
  "Unit",
  "Pack Size",
  "Weight",
  "Stock",
  "GST",
  "HSN",
  "Description",
  "Short Description",
  "Product Image Filename",
  "Brand Image Filename",
];

export default function ExcelImportPage() {
  const [excelFile, setExcelFile] =
    useState<File | null>(null);

  const [rows, setRows] =
    useState<ImportRow[]>([]);

  const [images, setImages] =
    useState<ImageFile[]>([]);

  const [previewImages, setPreviewImages] =
    useState<Map<string, string>>(
      new Map()
    );

  const [errors, setErrors] =
    useState<ImportError[]>([]);

  const [result, setResult] =
    useState<ImportResult | null>(
      null
    );

  const [processing, setProcessing] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [
    createMissingBrands,
    setCreateMissingBrands,
  ] = useState(true);

  const [
    requireExistingCategories,
    setRequireExistingCategories,
  ] = useState(true);

  const [
    updateExisting,
    setUpdateExisting,
  ] = useState(true);

  const [
    imageZipName,
    setImageZipName,
  ] = useState("");

  // --------------------------------------------------
  // EXCEL
  // --------------------------------------------------

  const readExcel = async (
    file: File
  ) => {
    try {
      setProcessing(true);
      setProgress(10);
      setErrors([]);
      setResult(null);

      const buffer =
        await file.arrayBuffer();

      setProgress(25);

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array",
          }
        );

      const sheetName =
        workbook
          .SheetNames[0];

      if (!sheetName) {
        throw new Error(
          "Excel sheet not found."
        );
      }

      const sheet =
        workbook.Sheets[
          sheetName
        ];

      const rawRows =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            defval: "",
            raw: false,
          }
        );

      if (
        !rawRows.length
      ) {
        throw new Error(
          "Excel file is empty."
        );
      }

      const normalized =
        rawRows.map(
          (
            row: any,
            index
          ) =>
            normalizeImportRow(
              row,
              index + 2
            )
        );

      setRows(
        normalized
      );

      const validation =
        validateImportRows(
          normalized
        );

      setErrors(
        validation
      );

      setProgress(100);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Excel could not be read."
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // IMAGE FOLDER
  // --------------------------------------------------

  const handleImages = (
    files: FileList | null
  ) => {
    if (!files) return;

    const list =
      Array.from(
        files
      ).map(
        (file) => ({
          name:
            normalizeFilename(
              file.name
            ),

          file,
        })
      );

    setImages(
      list
    );
  };

  // --------------------------------------------------
  // ZIP
  // --------------------------------------------------

  const handleZip = async (
    file: File
  ) => {
    try {
      setProcessing(true);
      setImageZipName(
        file.name
      );

      const zip =
        await JSZip.loadAsync(
          file
        );

      const files: ImageFile[] =
        [];

      const entries =
        Object.values(
          zip.files
        );

      for (
        const entry of entries
      ) {
        if (
          entry.dir
        ) {
          continue;
        }

        const name =
          normalizeFilename(
            entry.name
          );

        if (
          !/\.(jpg|jpeg|png|webp|gif)$/i.test(
            name
          )
        ) {
          continue;
        }

        const blob =
          await entry.async(
            "blob"
          );

        const imageFile =
          new File(
            [blob],
            name,
            {
              type:
                blob.type ||
                "image/jpeg",
            }
          );

        files.push({
          name,
          file:
            imageFile,
        });
      }

      setImages(
        files
      );

      alert(
        `${files.length} images found inside ZIP.`
      );
    } catch (error) {
      console.error(
        error
      );

      alert(
        "ZIP could not be read."
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // PREVIEW IMAGE URLS
  // --------------------------------------------------

  const buildImageMap =
    async () => {
      const map =
        new Map<
          string,
          string
        >();

      images.forEach(
        (item) => {
          map.set(
            item.name,
            URL.createObjectURL(
              item.file
            )
          );
        }
      );

      setPreviewImages(
        map
      );

      return map;
    };

  // --------------------------------------------------
  // IMPORT
  // --------------------------------------------------

  const startImport =
    async () => {
      if (
        !rows.length
      ) {
        alert(
          "First upload an Excel file."
        );

        return;
      }

      if (
        errors.length > 0
      ) {
        alert(
          "Please fix the Excel validation errors before importing."
        );

        return;
      }

      setProcessing(true);
      setProgress(5);
      setResult(null);

      try {
        const localImageMap =
          new Map<
            string,
            string
          >();

        images.forEach(
          (item) => {
            localImageMap.set(
              item.name,
              URL.createObjectURL(
                item.file
              )
            );
          }
        );

        setProgress(20);

        /*
         * Important:
         * Browser object URLs are only
         * previews. Real Firebase
         * product images need public
         * URLs.
         *
         * Therefore, if image matching
         * is requested, upload the
         * selected image files to
         * Cloudinary first.
         */

        const cloudinaryMap =
          new Map<
            string,
            string
          >();

        const brandCloudinaryMap =
          new Map<
            string,
            string
          >();

        if (
          images.length >
          0
        ) {
          let completed = 0;

          for (
            const item of images
          ) {
            const form =
              new FormData();

            form.append(
              "file",
              item.file
            );

            form.append(
              "upload_preset",
              "nightnow"
            );

            const response =
              await fetch(
                "https://api.cloudinary.com/v1_1/td3xwd7p/image/upload",
                {
                  method:
                    "POST",

                  body:
                    form,
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `Image upload failed: ${item.name}`
              );
            }

            const data =
              await response.json();

            const url =
              data?.secure_url;

            if (url) {
              cloudinaryMap.set(
                item.name,
                url
              );
            }

            completed++;

            setProgress(
              20 +
                Math.round(
                  (completed /
                    images.length) *
                    40
                )
            );
          }
        }

        setProgress(65);

        const finalImageMap =
          new Map<
            string,
            string
          >();

        cloudinaryMap.forEach(
          (
            value,
            key
          ) => {
            finalImageMap.set(
              key,
              value
            );
          }
        );

        const finalBrandMap =
          new Map<
            string,
            string
          >();

        cloudinaryMap.forEach(
          (
            value,
            key
          ) => {
            finalBrandMap.set(
              key,
              value
            );
          }
        );

        setProgress(75);

        const importResult =
          await importProducts({
            rows,

            imageMap:
              finalImageMap,

            brandImageMap:
              finalBrandMap,

            createMissingBrands,

            requireExistingCategories,

            updateExisting,
          });

        setProgress(95);

        await saveImportHistory(
          importResult,

          excelFile?.name ||
            "Excel Import"
        );

        setResult(
          importResult
        );

        setProgress(100);
      } catch (error) {
        console.error(
          "Import error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Import failed."
        );
      } finally {
        setProcessing(false);
      }
    };

  // --------------------------------------------------
  // TEMPLATE
  // --------------------------------------------------

  const downloadTemplate =
    () => {
      const worksheet =
        XLSX.utils.aoa_to_sheet(
          [
            TEMPLATE_HEADERS,

            [
              "Amul",
              "Taaza Milk",
              "Dairy, Bread & Eggs",
              "Milk",
              "AMUL-001",
              "890000000001",
              60,
              55,
              "",
              "L",
              "1 litre",
              "1",
              100,
              5,
              "0401",
              "Fresh milk",
              "Fresh toned milk",
              "amul-taaza-1l.jpg",
              "amul.jpg",
            ],
          ]
        );

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Products"
      );

      XLSX.writeFile(
        workbook,
        "NightNow-Product-Import-Template.xlsx"
      );
    };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const reset =
    () => {
      setExcelFile(null);
      setRows([]);
      setImages([]);
      setErrors([]);
      setResult(null);
      setPreviewImages(
        new Map()
      );
      setProgress(0);
      setImageZipName("");
    };

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const validRows =
    useMemo(
      () =>
        Math.max(
          0,
          rows.length -
            errors.length
        ),
      [
        rows.length,
        errors.length,
      ]
    );

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-4 md:p-7">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-600">
              NightNow Admin
            </p>

            <h1 className="mt-1 text-3xl font-black text-zinc-900">
              Excel Bulk Import
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Bulk create or update
              products with brand,
              category and image
              matching.
            </p>
          </div>

          <button
            type="button"
            onClick={
              downloadTemplate
            }
            className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black text-zinc-900 hover:bg-yellow-300"
          >
            Download Excel Template
          </button>

        </div>

        {/* STEP 1 */}

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          <h2 className="text-lg font-black">
            1. Upload Excel
          </h2>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center hover:border-yellow-400 hover:bg-yellow-50">

            <div className="text-4xl">
              📊
            </div>

            <p className="mt-2 text-sm font-black">
              {excelFile
                ? excelFile.name
                : "Choose Excel file"}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              .xlsx / .xls / .csv
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(
                event
              ) => {
                const file =
                  event
                    .target
                    .files?.[0];

                if (!file)
                  return;

                setExcelFile(
                  file
                );

                void readExcel(
                  file
                );
              }}
            />

          </label>

        </section>

        {/* STEP 2 */}

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          <h2 className="text-lg font-black">
            2. Product Images
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Excel में दिए हुए
            filename के आधार पर
            image automatically
            match होगी।
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center hover:border-yellow-400">

              <div>
                <div className="text-3xl">
                  🖼️
                </div>

                <p className="mt-2 text-sm font-black">
                  Select Images
                </p>

                <p className="text-xs text-zinc-500">
                  Multiple images
                </p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(
                  event
                ) =>
                  handleImages(
                    event.target
                      .files
                  )
                }
              />

            </label>

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center hover:border-yellow-400">

              <div>
                <div className="text-3xl">
                  📦
                </div>

                <p className="mt-2 text-sm font-black">
                  Select Images ZIP
                </p>

                <p className="text-xs text-zinc-500">
                  Product + Brand images
                </p>
              </div>

              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(
                  event
                ) => {
                  const file =
                    event
                      .target
                      .files?.[0];

                  if (file) {
                    void handleZip(
                      file
                    );
                  }
                }}
              />

            </label>

          </div>

          {imageZipName && (
            <div className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">
              ZIP:{" "}
              {imageZipName}{" "}
              — {images.length} images
              found.
            </div>
          )}

          {images.length >
            0 && (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs font-bold text-zinc-600">
              {images.length} image
              files selected.
            </div>
          )}

        </section>

        {/* OPTIONS */}

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          <h2 className="text-lg font-black">
            3. Import Rules
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <input
                type="checkbox"
                checked={
                  createMissingBrands
                }
                onChange={(e) =>
                  setCreateMissingBrands(
                    e.target
                      .checked
                  )
                }
              />

              <span className="text-xs font-black">
                Create missing brands
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <input
                type="checkbox"
                checked={
                  requireExistingCategories
                }
                onChange={(e) =>
                  setRequireExistingCategories(
                    e.target
                      .checked
                  )
                }
              />

              <span className="text-xs font-black">
                Require existing categories
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <input
                type="checkbox"
                checked={
                  updateExisting
                }
                onChange={(e) =>
                  setUpdateExisting(
                    e.target
                      .checked
                  )
                }
              />

              <span className="text-xs font-black">
                Update existing SKU
              </span>
            </label>

          </div>

        </section>

        {/* PROGRESS */}

        {processing && (
          <section className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-5">

            <div className="flex items-center justify-between">
              <span className="text-sm font-black">
                Processing...
              </span>

              <span className="text-sm font-black">
                {progress}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

          </section>
        )}

        {/* PREVIEW */}

        {rows.length >
          0 && (
          <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-black">
                  4. Preview & Validation
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Total{" "}
                  {rows.length}
                  {" • "}
                  Valid{" "}
                  {validRows}
                  {" • "}
                  Errors{" "}
                  {errors.length}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  processing ||
                  errors.length >
                    0
                }
                onClick={
                  startImport
                }
                className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Import Products
              </button>

            </div>

            {errors.length >
              0 && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">

                <p className="text-sm font-black text-red-700">
                  Fix these errors
                  before import:
                </p>

                <div className="mt-3 max-h-72 overflow-auto space-y-2">

                  {errors
                    .slice(
                      0,
                      100
                    )
                    .map(
                      (
                        error
                      ) => (
                        <div
                          key={`${error.rowNumber}-${error.sku}`}
                          className="rounded-xl bg-white p-3"
                        >
                          <p className="text-xs font-black text-zinc-800">
                            Row{" "}
                            {
                              error.rowNumber
                            }{" "}
                            —{" "}
                            {
                              error.productName
                            }
                          </p>

                          <p className="mt-1 text-xs text-red-600">
                            {
                              error.errors.join(
                                " • "
                              )
                            }
                          </p>
                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            <div className="mt-4 overflow-auto rounded-2xl border border-zinc-200">

              <table className="min-w-[1100px] w-full text-left text-xs">

                <thead className="bg-zinc-50">
                  <tr>
                    <th className="p-3 font-black">
                      Row
                    </th>

                    <th className="p-3 font-black">
                      Product
                    </th>

                    <th className="p-3 font-black">
                      Brand
                    </th>

                    <th className="p-3 font-black">
                      Category
                    </th>

                    <th className="p-3 font-black">
                      SKU
                    </th>

                    <th className="p-3 font-black">
                      MRP
                    </th>

                    <th className="p-3 font-black">
                      Sale
                    </th>

                    <th className="p-3 font-black">
                      Stock
                    </th>

                    <th className="p-3 font-black">
                      Image
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {rows
                    .slice(
                      0,
                      100
                    )
                    .map(
                      (
                        row
                      ) => (
                        <tr
                          key={
                            row.rowNumber
                          }
                          className="border-t border-zinc-100"
                        >

                          <td className="p-3 font-bold">
                            {
                              row.rowNumber
                            }
                          </td>

                          <td className="p-3 font-black">
                            {
                              row.productName
                            }
                          </td>

                          <td className="p-3">
                            {
                              row.brand
                            }
                          </td>

                          <td className="p-3">
                            {
                              row.category
                            }
                          </td>

                          <td className="p-3">
                            {
                              row.sku
                            }
                          </td>

                          <td className="p-3">
                            ₹
                            {
                              row.mrp
                            }
                          </td>

                          <td className="p-3 font-black text-green-600">
                            ₹
                            {
                              row.salePrice
                            }
                          </td>

                          <td className="p-3">
                            {
                              row.stock
                            }
                          </td>

                          <td className="p-3">
                            {row.productImageFilename ||
                              "—"}
                          </td>

                        </tr>
                      )
                    )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* RESULT */}

        {result && (
          <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">

            <h2 className="text-lg font-black">
              Import Complete
            </h2>

            <div className="mt-4 grid grid-cols-3 gap-3">

              <div className="rounded-2xl bg-green-50 p-4 text-center">
                <p className="text-2xl font-black text-green-700">
                  {
                    result.created
                  }
                </p>
                <p className="text-xs font-bold text-green-700">
                  Created
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 text-center">
                <p className="text-2xl font-black text-blue-700">
                  {
                    result.updated
                  }
                </p>
                <p className="text-xs font-bold text-blue-700">
                  Updated
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-black text-red-700">
                  {
                    result.failed
                  }
                </p>
                <p className="text-xs font-bold text-red-700">
                  Failed
                </p>
              </div>

            </div>

            {result.failed >
              0 && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4">

                <p className="text-sm font-black text-red-700">
                  Failed Rows
                </p>

                <div className="mt-3 space-y-2">

                  {result.errors
                    .slice(
                      0,
                      100
                    )
                    .map(
                      (
                        error
                      ) => (
                        <div
                          key={`${error.rowNumber}-${error.sku}`}
                          className="rounded-xl bg-white p-3"
                        >
                          <p className="text-xs font-black">
                            Row{" "}
                            {
                              error.rowNumber
                            }{" "}
                            —{" "}
                            {
                              error.productName
                            }
                          </p>

                          <p className="mt-1 text-xs text-red-600">
                            {
                              error.errors.join(
                                " • "
                              )
                            }
                          </p>
                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            <button
              type="button"
              onClick={
                reset
              }
              className="mt-5 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-black hover:bg-zinc-50"
            >
              New Import
            </button>

          </section>
        )}

      </div>
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getProducts,
  type Product,
} from "../../services/productService";

import {
  getCampaigns,
  type Campaign,
} from "../../services/campaignService";

/* =====================================================
   TYPES
===================================================== */

type HomeCategory = {
  id: string;
  name: string;
  section: string;
  heading: string;
  subtitle: string;
  image: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
};

type SectionDraft = {
  key: string;
  section: string;
  heading: string;
  subtitle: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
  campaignIds: string[];
  categories: HomeCategory[];
};

type HistorySection = {
  key: string;
  section: string;
  heading: string;
  subtitle: string;
  order: number;
  active: boolean;
  showOnHome: boolean;
  productIds: string[];
  campaignIds: string[];
};

type HistoryEntry = {
  id: string;
  savedAt: string;
  items: HomeCategory[];
  sections?: HistorySection[];
};

/* =====================================================
   STORAGE
===================================================== */

const STORAGE_KEY =
  "nightnow_admin_categories";

const HOME_SECTIONS_KEY =
  "nightnow_home_sections";

const HISTORY_KEY =
  "nightnow_admin_categories_history";

/* =====================================================
   SUBTITLES
===================================================== */

const SUBTITLE_OPTIONS = [
  "Everyday essentials",
  "Tasty picks for every time",
  "Explore our best picks",
  "Top picks for you",
  "Best deals for you",
  "Fresh picks delivered fast",
  "Shop your daily essentials",
  "More products you may like",
  "New arrivals & popular picks",
  "Value deals for every day",
];

/* =====================================================
   HELPERS
===================================================== */

const safe = (
  value: unknown,
  fallback = ""
) => String(value ?? fallback);

const normalizeCategory = (
  item: Partial<HomeCategory>,
  index = 0
): HomeCategory => ({
  id: safe(
    item.id,
    crypto.randomUUID()
  ),

  name: safe(item.name),

  section: safe(
    item.section ||
      item.heading ||
      item.name,
    "Products"
  ),

  heading: safe(
    item.heading ||
      item.section ||
      item.name,
    "Products"
  ),

  subtitle: safe(
    item.subtitle,
    "Explore more products"
  ),

  image: safe(item.image),

  order: Number(
    item.order || index + 1
  ),

  active:
    item.active !== false,

  showOnHome:
    item.showOnHome !== false,

  productIds:
    Array.isArray(item.productIds)
      ? item.productIds.map(String)
      : [],
});

/* =====================================================
   GROUP SECTIONS
===================================================== */

function groupSections(
  items: HomeCategory[]
): SectionDraft[] {
  const map =
    new Map<string, SectionDraft>();

  items.forEach((raw, index) => {
    const item =
      normalizeCategory(
        raw,
        index
      );

    const section =
      item.section.trim() ||
      item.heading.trim() ||
      item.name.trim() ||
      "Products";

    const key =
      section.toLowerCase();

    let group =
      map.get(key);

    if (!group) {
      group = {
        key,

        section,

        heading:
          item.heading ||
          section,

        subtitle:
          item.subtitle ||
          "Explore more products",

        order:
          item.order ||
          index + 1,

        active:
          item.active,

        showOnHome:
          item.showOnHome,

        productIds: [],

        campaignIds: [],

        categories: [],
      };

      map.set(
        key,
        group
      );
    }

    group.categories.push({
      ...item,
      section,
    });

    group.productIds =
      Array.from(
        new Set([
          ...group.productIds,
          ...item.productIds.map(
            String
          ),
        ])
      );

    if (
      group.categories.length ===
      1
    ) {
      group.heading =
        item.heading ||
        section;

      group.subtitle =
        item.subtitle ||
        "Explore more products";

      group.order =
        item.order ||
        index + 1;

      group.active =
        item.active;

      group.showOnHome =
        item.showOnHome;
    }
  });

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.order - b.order
  );
}

/* =====================================================
   HISTORY RESTORE
===================================================== */

function sectionsFromHistory(
  entry: HistoryEntry
): SectionDraft[] {
  const grouped =
    groupSections(
      Array.isArray(entry.items)
        ? entry.items
        : []
    );

  if (
    !Array.isArray(
      entry.sections
    ) ||
    entry.sections.length === 0
  ) {
    return grouped;
  }

  return grouped.map(
    (group) => {
      const match =
        entry.sections?.find(
          (section) =>
            String(
              section.section
            )
              .trim()
              .toLowerCase() ===
            group.section
              .trim()
              .toLowerCase()
        );

      if (!match) {
        return group;
      }

      return {
        ...group,

        key:
          match.key ||
          group.key,

        section:
          match.section ||
          group.section,

        heading:
          match.heading ||
          group.heading,

        subtitle:
          match.subtitle ||
          group.subtitle,

        order:
          Number(
            match.order ||
              group.order
          ),

        active:
          match.active !==
          false,

        showOnHome:
          match.showOnHome !==
          false,

        productIds:
          Array.from(
            new Set(
              (
                match.productIds ||
                []
              ).map(String)
            )
          ),

        campaignIds:
          Array.from(
            new Set(
              (
                match.campaignIds ||
                []
              ).map(String)
            )
          ),

        categories:
          group.categories.map(
            (category) => ({
              ...category,

              section:
                match.section ||
                category.section,

              heading:
                match.heading ||
                category.heading,

              subtitle:
                match.subtitle ||
                category.subtitle,

              order:
                Number(
                  match.order ||
                    category.order
                ),

              active:
                match.active !==
                false,

              showOnHome:
                match.showOnHome !==
                false,

              productIds:
                Array.from(
                  new Set(
                    (
                      match.productIds ||
                      []
                    ).map(String)
                  )
                ),
            })
          ),
      };
    }
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function HomeCategoriesAdminPage() {
  const [
    sections,
    setSections,
  ] = useState<
    SectionDraft[]
  >([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    campaigns,
    setCampaigns,
  ] = useState<Campaign[]>([]);

  const [
    history,
    setHistory,
  ] = useState<
    HistoryEntry[]
  >([]);

  const [
    openProducts,
    setOpenProducts,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    openCampaigns,
    setOpenCampaigns,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    search,
    setSearch,
  ] = useState<
    Record<string, string>
  >({});

  const [
    campaignSearch,
    setCampaignSearch,
  ] = useState<
    Record<string, string>
  >({});

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw =
          localStorage.getItem(
            STORAGE_KEY
          );

        const parsed =
          raw
            ? JSON.parse(raw)
            : [];

        const grouped =
          groupSections(
            Array.isArray(parsed)
              ? parsed
              : []
          );

        const rawSections =
          localStorage.getItem(
            HOME_SECTIONS_KEY
          );

        if (
          rawSections
        ) {
          try {
            const savedSections =
              JSON.parse(
                rawSections
              );

            if (
              Array.isArray(
                savedSections
              )
            ) {
              grouped.forEach(
                (section) => {
                  const savedSection =
                    savedSections.find(
                      (item: any) =>
                        String(
                          item.section
                        )
                          .trim()
                          .toLowerCase() ===
                        section.section
                          .trim()
                          .toLowerCase()
                    );

                  if (
                    savedSection
                  ) {
                    section.key =
                      savedSection.key ||
                      section.key;

                    section.heading =
                      savedSection.heading ||
                      section.heading;

                    section.subtitle =
                      savedSection.subtitle ||
                      section.subtitle;

                    section.order =
                      Number(
                        savedSection.order ||
                          section.order
                      );

                    section.active =
                      savedSection.active !==
                      false;

                    section.showOnHome =
                      savedSection.showOnHome !==
                      false;

                    section.productIds =
                      Array.from(
                        new Set(
                          (
                            savedSection.productIds ||
                            section.productIds ||
                            []
                          ).map(String)
                        )
                      );

                    section.campaignIds =
                      Array.from(
                        new Set(
                          (
                            savedSection.campaignIds ||
                            []
                          ).map(String)
                        )
                      );
                  }
                }
              );
            }
          } catch {
            // Keep existing category data.
          }
        }

        setSections(
          grouped
        );

        const rawHistory =
          localStorage.getItem(
            HISTORY_KEY
          );

        const parsedHistory =
          rawHistory
            ? JSON.parse(
                rawHistory
              )
            : [];

        setHistory(
          Array.isArray(
            parsedHistory
          )
            ? parsedHistory
            : []
        );
      } catch {
        setSections([]);
        setHistory([]);
      }

      try {
        const [
          productData,
          campaignData,
        ] =
          await Promise.all([
            getProducts(),

            getCampaigns(),
          ]);

        if (
          cancelled
        ) {
          return;
        }

        setProducts(
          Array.isArray(
            productData
          )
            ? productData.filter(
                (product: any) =>
                  product?.active !==
                  false
              )
            : []
        );

        setCampaigns(
          Array.isArray(
            campaignData
          )
            ? campaignData
            : []
        );
      } catch (
        error
      ) {
        console.error(
          "Home Sections data load error:",
          error
        );

        if (
          !cancelled
        ) {
          setProducts([]);
          setCampaigns([]);
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoaded(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     UPDATE SECTION
  ===================================================== */

  const updateSection = (
    key: string,
    patch: Partial<SectionDraft>
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.key === key
              ? {
                  ...section,
                  ...patch,
                }
              : section
        )
    );
  };

  /* =====================================================
     UPDATE CATEGORY
  ===================================================== */

  const updateCategory = (
    sectionKey: string,
    id: string,
    patch: Partial<HomeCategory>
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.key !==
            sectionKey
              ? section
              : {
                  ...section,

                  categories:
                    section.categories.map(
                      (category) =>
                        category.id ===
                        id
                          ? {
                              ...category,
                              ...patch,
                            }
                          : category
                    ),
                }
        )
    );
  };

  /* =====================================================
     ADD SECTION
  ===================================================== */

  const addSection = () => {
    const id =
      crypto.randomUUID();

    setSections(
      (current) => [
        ...current,

        {
          key: id,

          section:
            "New Section",

          heading:
            "New Section",

          subtitle:
            SUBTITLE_OPTIONS[0],

          order:
            current.length + 1,

          active: true,

          showOnHome: true,

          productIds: [],

          campaignIds: [],

          categories: [
            {
              id:
                crypto.randomUUID(),

              name:
                "New Category",

              section:
                "New Section",

              heading:
                "New Section",

              subtitle:
                SUBTITLE_OPTIONS[0],

              image: "",

              order:
                current.length + 1,

              active: true,

              showOnHome: true,

              productIds: [],
            },
          ],
        },
      ]
    );
  };

  /* =====================================================
     ADD CATEGORY
  ===================================================== */

  const addCategory = (
    sectionKey: string
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.key !==
            sectionKey
              ? section
              : {
                  ...section,

                  categories: [
                    ...section.categories,

                    {
                      id:
                        crypto.randomUUID(),

                      name:
                        "New Category",

                      section:
                        section.section,

                      heading:
                        section.heading,

                      subtitle:
                        section.subtitle,

                      image: "",

                      order:
                        section
                          .categories
                          .length +
                        1,

                      active: true,

                      showOnHome: true,

                      productIds: [],
                    },
                  ],
                }
        )
    );
  };

  /* =====================================================
     REMOVE CATEGORY
  ===================================================== */

  const removeCategory = (
    sectionKey: string,
    id: string
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.key !==
            sectionKey
              ? section
              : {
                  ...section,

                  categories:
                    section.categories.filter(
                      (category) =>
                        category.id !==
                        id
                    ),
                }
        )
    );
  };

  /* =====================================================
     REMOVE SECTION
  ===================================================== */

  const removeSection = (
    key: string
  ) => {
    if (
      !confirm(
        "Delete this complete Home Page section?"
      )
    ) {
      return;
    }

    setSections(
      (current) =>
        current.filter(
          (section) =>
            section.key !== key
        )
    );
  };

  /* =====================================================
     IMAGE
  ===================================================== */

  const handleImage = (
    sectionKey: string,
    id: string,
    file?: File
  ) => {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      alert(
        "Please keep category images below 2 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () =>
      updateCategory(
        sectionKey,
        id,
        {
          image:
            String(
              reader.result ||
                ""
            ),
        }
      );

    reader.readAsDataURL(
      file
    );
  };

  /* =====================================================
     PRODUCT SEARCH
  ===================================================== */

  const filteredProducts = (
    key: string
  ) => {
    const q =
      String(
        search[key] || ""
      )
        .toLowerCase()
        .trim();

    if (!q) {
      return products.slice(
        0,
        100
      );
    }

    return products
      .filter(
        (product: any) =>
          [
            product.name,
            product.title,
            product.brandName,
            product.category,
            product.sku,
            product.code,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
      )
      .slice(0, 100);
  };

  /* =====================================================
     CAMPAIGN SEARCH
  ===================================================== */

  const filteredCampaigns = (
    key: string
  ) => {
    const q =
      String(
        campaignSearch[key] ||
          ""
      )
        .toLowerCase()
        .trim();

    if (!q) {
      return campaigns;
    }

    return campaigns.filter(
      (campaign) =>
        [
          campaign.name,
          campaign.slug,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
    );
  };

  /* =====================================================
     TOGGLE PRODUCT
  ===================================================== */

  const toggleProduct = (
    key: string,
    id: string
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) => {
            if (
              section.key !==
              key
            ) {
              return section;
            }

            const has =
              section.productIds.includes(
                id
              );

            return {
              ...section,

              productIds:
                has
                  ? section.productIds.filter(
                      (item) =>
                        item !== id
                    )
                  : [
                      ...section.productIds,
                      id,
                    ],
            };
          }
        )
    );
  };

  /* =====================================================
     TOGGLE CAMPAIGN
  ===================================================== */

  const toggleCampaign = (
    key: string,
    id: string
  ) => {
    setSections(
      (current) =>
        current.map(
          (section) => {
            if (
              section.key !==
              key
            ) {
              return section;
            }

            const has =
              section.campaignIds.includes(
                id
              );

            return {
              ...section,

              campaignIds:
                has
                  ? section.campaignIds.filter(
                      (item) =>
                        item !== id
                    )
                  : [
                      ...section.campaignIds,
                      id,
                    ],
            };
          }
        )
    );
  };

  /* =====================================================
     HISTORY RESTORE
  ===================================================== */

  const restoreHistory = (
    entry: HistoryEntry
  ) => {
    const restored =
      sectionsFromHistory(
        entry
      );

    setSections(
      restored
    );

    setSaved(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     DELETE HISTORY
  ===================================================== */

  const deleteHistory = (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this history version? This will not change the currently saved Home Page."
      )
    ) {
      return;
    }

    const next =
      history.filter(
        (entry) =>
          entry.id !== id
      );

    setHistory(next);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(next)
    );
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const save = () => {
    const flat: HomeCategory[] =
      [];

    sections.forEach(
      (
        section,
        sectionIndex
      ) => {
        const heading =
          section.heading.trim() ||
          section.section.trim() ||
          "Products";

        const subtitle =
          section.subtitle.trim() ||
          "Explore more products";

        const sectionName =
          section.section.trim() ||
          heading;

        section.categories
          .filter(
            (category) =>
              category.name.trim()
          )
          .forEach(
            (
              category
            ) => {
              flat.push({
                ...category,

                section:
                  sectionName,

                heading,

                subtitle,

                order:
                  Number(
                    section.order ||
                      sectionIndex +
                        1
                  ),

                active:
                  section.active,

                showOnHome:
                  section.showOnHome,

                productIds: [
                  ...section.productIds,
                ],

                image:
                  category.image ||
                  "",

                name:
                  category.name.trim(),
              });
            }
          );
      }
    );

    flat.sort(
      (a, b) =>
        a.order -
          b.order ||
        a.name.localeCompare(
          b.name
        )
    );

    /* =================================================
       SECTION PAYLOAD
    ================================================= */

    const sectionPayload =
      sections
        .filter(
          (section) =>
            section.categories
              .length > 0 ||
            section.campaignIds
              .length > 0
        )
        .map(
          (
            section,
            sectionIndex
          ) => ({
            key: section.key,

            section:
              section.section.trim() ||
              section.heading.trim() ||
              `Section ${
                sectionIndex +
                1
              }`,

            heading:
              section.heading.trim() ||
              section.section.trim() ||
              `Section ${
                sectionIndex +
                1
              }`,

            subtitle:
              section.subtitle.trim() ||
              "Explore more products",

            order:
              Number(
                section.order ||
                  sectionIndex +
                    1
              ),

            active:
              section.active,

            showOnHome:
              section.showOnHome,

            productIds:
              Array.from(
                new Set(
                  section.productIds.map(
                    String
                  )
                )
              ),

            campaignIds:
              Array.from(
                new Set(
                  section.campaignIds.map(
                    String
                  )
                )
              ),
          })
        )
        .sort(
          (a, b) =>
            a.order -
            b.order
        );

    /* =================================================
       COMPACT HISTORY
    ================================================= */

    const compactItems: HomeCategory[] =
      flat.map(
        (item) => ({
          id: item.id,

          name: item.name,

          section:
            item.section,

          heading:
            item.heading,

          subtitle:
            item.subtitle,

          image: "",

          order:
            item.order,

          active:
            item.active,

          showOnHome:
            item.showOnHome,

          productIds: [],
        })
      );

    const snapshot: HistoryEntry =
      {
        id:
          crypto.randomUUID(),

        savedAt:
          new Date().toISOString(),

        items:
          compactItems,

        sections:
          sectionPayload,
      };

    /* =================================================
       HISTORY QUOTA PROTECTION
    ================================================= */

    let nextHistory =
      [
        snapshot,
        ...history,
      ].slice(0, 10);

    const persistHistory =
      () => {
        const serialized =
          JSON.stringify(
            nextHistory
          );

        try {
          localStorage.setItem(
            HISTORY_KEY,
            serialized
          );

          return true;
        } catch (
          error
        ) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "QuotaExceededError"
          ) {
            if (
              nextHistory.length >
              1
            ) {
              nextHistory =
                nextHistory.slice(
                  0,
                  Math.max(
                    1,
                    Math.floor(
                      nextHistory.length /
                        2
                    )
                  )
                );

              return persistHistory();
            }

            localStorage.removeItem(
              HISTORY_KEY
            );

            try {
              localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify([
                  snapshot,
                ])
              );

              nextHistory =
                [snapshot];

              return true;
            } catch {
              nextHistory = [];

              return false;
            }
          }

          throw error;
        }
      };

    /* =================================================
       SAVE CURRENT DATA
    ================================================= */

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        flat
      )
    );

    localStorage.setItem(
      HOME_SECTIONS_KEY,
      JSON.stringify(
        sectionPayload
      )
    );

    persistHistory();

    window.dispatchEvent(
      new CustomEvent(
        "nightnow_admin_categories_updated"
      )
    );

    setHistory(
      nextHistory
    );

    setSections(
      groupSections(flat).map(
        (section) => {
          const savedSection =
            sectionPayload.find(
              (item) =>
                String(
                  item.section
                )
                  .trim()
                  .toLowerCase() ===
                section.section
                  .trim()
                  .toLowerCase()
            );

          return {
            ...section,

            campaignIds:
              savedSection
                ?.campaignIds ||
              [],
          };
        }
      )
    );

    setSaved(true);

    setTimeout(
      () => setSaved(false),
      1800
    );
  };

  /* =====================================================
     ACTIVE CAMPAIGNS COUNT
  ===================================================== */

  const activeCampaignCount =
    useMemo(() => {
      const now =
        Date.now();

      return campaigns.filter(
        (campaign) => {
          if (
            !campaign.active
          ) {
            return false;
          }

          if (
            campaign.startDate
          ) {
            const start =
              new Date(
                campaign.startDate
              ).getTime();

            if (
              Number.isFinite(
                start
              ) &&
              now < start
            ) {
              return false;
            }
          }

          if (
            campaign.endDate
          ) {
            const end =
              new Date(
                campaign.endDate
              ).getTime();

            if (
              Number.isFinite(
                end
              ) &&
              now > end
            ) {
              return false;
            }
          }

          return true;
        }
      ).length;
    }, [campaigns]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (!loaded) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6">
        Loading...
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900">
      <div className="mx-auto max-w-5xl">

        {/* ============================================
            HEADER
        ============================================ */}

        <div className="mb-5 flex items-center justify-between gap-3">

          <div>
            <h1 className="text-xl font-black">
              Home Page Sections
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              Manage Home Page sections,
              products, categories and
              campaigns from one place.
            </p>
          </div>

          <button
            onClick={addSection}
            className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white"
          >
            + Add Section
          </button>

        </div>

        {/* ============================================
            CAMPAIGN STATUS
        ============================================ */}

        <div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

          <div className="flex items-center justify-between gap-3">

            <div>
              <p className="text-xs font-black text-zinc-900">
                Campaigns
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                {campaigns.length} campaigns available ·{" "}
                {activeCampaignCount} currently active
              </p>
            </div>

            <a
              href="/admin/campaigns"
              className="rounded-xl bg-black px-3 py-2 text-[10px] font-black text-white"
            >
              Manage Campaigns
            </a>

          </div>

        </div>

        {/* ============================================
            SECTIONS
        ============================================ */}

        <div className="space-y-5">

          {sections.map(
            (
              section,
              sectionIndex
            ) => (

              <section
                key={section.key}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >

                {/* SECTION HEADER */}

                <div className="mb-4 flex items-center justify-between">

                  <p className="text-sm font-black">
                    Home Section #
                    {sectionIndex + 1}
                  </p>

                  <button
                    onClick={() =>
                      removeSection(
                        section.key
                      )
                    }
                    className="text-xs font-black text-red-500"
                  >
                    Delete Section
                  </button>

                </div>

                <div className="grid gap-3 md:grid-cols-2">

                  {/* GROUP */}

                  <label className="text-xs font-bold">
                    Section Group

                    <input
                      value={
                        section.section
                      }
                      onChange={(event) =>
                        updateSection(
                          section.key,
                          {
                            section:
                              event.target
                                .value,
                          }
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>

                  {/* ORDER */}

                  <label className="text-xs font-bold">
                    Display Order

                    <input
                      type="number"
                      min={1}
                      value={
                        section.order
                      }
                      onChange={(event) =>
                        updateSection(
                          section.key,
                          {
                            order:
                              Number(
                                event
                                  .target
                                  .value
                              ) || 1,
                          }
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>

                  {/* HEADING */}

                  <label className="text-xs font-bold md:col-span-2">
                    Home Page Heading

                    <input
                      value={
                        section.heading
                      }
                      onChange={(event) =>
                        updateSection(
                          section.key,
                          {
                            heading:
                              event.target
                                .value,
                          }
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Grocery & Kitchen"
                    />
                  </label>

                  {/* SUBTITLE */}

                  <label className="text-xs font-bold md:col-span-2">
                    Home Page Subtitle

                    <select
                      value={
                        SUBTITLE_OPTIONS.includes(
                          section.subtitle
                        )
                          ? section.subtitle
                          : SUBTITLE_OPTIONS[0]
                      }
                      onChange={(event) =>
                        updateSection(
                          section.key,
                          {
                            subtitle:
                              event.target
                                .value,
                          }
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      {SUBTITLE_OPTIONS.map(
                        (option) => (
                          <option
                            key={option}
                          >
                            {option}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {/* STATUS */}

                  <div className="flex items-end gap-4 pb-2">

                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={
                          section.showOnHome
                        }
                        onChange={(event) =>
                          updateSection(
                            section.key,
                            {
                              showOnHome:
                                event
                                  .target
                                  .checked,
                            }
                          )
                        }
                      />

                      Show on Home
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={
                          section.active
                        }
                        onChange={(event) =>
                          updateSection(
                            section.key,
                            {
                              active:
                                event
                                  .target
                                  .checked,
                            }
                          )
                        }
                      />

                      Active
                    </label>

                  </div>

                  {/* ==================================
                      CAMPAIGNS
                  ================================== */}

                  <div className="md:col-span-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 p-3">

                    <div className="flex items-center justify-between gap-2">

                      <div>
                        <p className="text-xs font-black">
                          Campaigns under this section
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          Select campaigns that should
                          belong to this Home section.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCampaigns(
                            (value) => ({
                              ...value,
                              [section.key]:
                                !value[
                                  section.key
                                ],
                            })
                          )
                        }
                        className="rounded-xl bg-white px-3 py-2 text-[10px] font-black shadow-sm"
                      >
                        {openCampaigns[
                          section.key
                        ]
                          ? "Hide Campaigns"
                          : `Choose Campaigns (${section.campaignIds.length})`}
                      </button>

                    </div>

                    {/* SELECTED CAMPAIGNS */}

                    {section.campaignIds
                      .length >
                      0 && (

                      <div className="mt-2 flex flex-wrap gap-1.5">

                        {section.campaignIds.map(
                          (campaignId) => {

                            const campaign =
                              campaigns.find(
                                (item) =>
                                  String(
                                    item.id
                                  ) ===
                                  String(
                                    campaignId
                                  )
                              );

                            return (
                              <span
                                key={
                                  campaignId
                                }
                                className="rounded-full bg-white px-2 py-1 text-[9px] font-bold"
                              >
                                {campaign
                                  ?.name ||
                                  campaignId}
                              </span>
                            );
                          }
                        )}

                      </div>
                    )}

                    {/* CAMPAIGN PICKER */}

                    {openCampaigns[
                      section.key
                    ] && (

                      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">

                        <input
                          value={
                            campaignSearch[
                              section.key
                            ] || ""
                          }
                          onChange={(event) =>
                            setCampaignSearch(
                              (value) => ({
                                ...value,
                                [section.key]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Search campaign..."
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                        />

                        <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto">

                          {filteredCampaigns(
                            section.key
                          ).map(
                            (
                              campaign
                            ) => {

                              const id =
                                String(
                                  campaign.id
                                );

                              const checked =
                                section.campaignIds.includes(
                                  id
                                );

                              return (
                                <label
                                  key={
                                    id
                                  }
                                  className="flex cursor-pointer gap-3 rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50"
                                >

                                  <input
                                    type="checkbox"
                                    checked={
                                      checked
                                    }
                                    onChange={() =>
                                      toggleCampaign(
                                        section.key,
                                        id
                                      )
                                    }
                                    className="mt-1"
                                  />

                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-center justify-between gap-2">

                                      <p className="truncate text-[10px] font-black">
                                        {
                                          campaign.name
                                        }
                                      </p>

                                      <span
                                        className={`rounded-full px-2 py-1 text-[8px] font-black ${
                                          campaign.active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-zinc-100 text-zinc-500"
                                        }`}
                                      >
                                        {campaign.active
                                          ? "Active"
                                          : "Inactive"}
                                      </span>

                                    </div>

                                    <p className="mt-1 truncate text-[9px] text-zinc-500">
                                      /{campaign.slug}
                                    </p>

                                    {campaign.banner && (
                                      <div className="mt-2 h-20 overflow-hidden rounded-lg border bg-zinc-50">

                                        <img
                                          src={
                                            campaign.banner
                                          }
                                          alt={
                                            campaign.name
                                          }
                                          className="h-full w-full object-cover"
                                        />

                                      </div>
                                    )}

                                    <div className="mt-2 flex flex-wrap gap-2 text-[8px] text-zinc-500">

                                      <span>
                                        Priority:{" "}
                                        {
                                          campaign.priority
                                        }
                                      </span>

                                      {campaign.startDate && (
                                        <span>
                                          Start:{" "}
                                          {
                                            campaign.startDate
                                          }
                                        </span>
                                      )}

                                      {campaign.endDate && (
                                        <span>
                                          End:{" "}
                                          {
                                            campaign.endDate
                                          }
                                        </span>
                                      )}

                                    </div>

                                  </div>

                                </label>
                              );
                            }
                          )}

                          {filteredCampaigns(
                            section.key
                          ).length ===
                            0 && (
                            <p className="py-6 text-center text-xs text-zinc-400">
                              No campaigns found.
                            </p>
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                  {/* ==================================
                      PRODUCTS
                  ================================== */}

                  <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">

                    <div className="flex items-center justify-between gap-2">

                      <div>
                        <p className="text-xs font-black">
                          Products under this heading
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          These selected products will
                          appear in this section on Home.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenProducts(
                            (value) => ({
                              ...value,
                              [section.key]:
                                !value[
                                  section.key
                                ],
                            })
                          )
                        }
                        className="rounded-xl bg-white px-3 py-2 text-[10px] font-black shadow-sm"
                      >
                        {openProducts[
                          section.key
                        ]
                          ? "Hide Products"
                          : `Choose Products (${section.productIds.length})`}
                      </button>

                    </div>

                    {section.productIds
                      .length >
                      0 && (

                      <div className="mt-2 flex flex-wrap gap-1.5">

                        {section.productIds.map(
                          (id) => {

                            const product: any =
                              products.find(
                                (item: any) =>
                                  String(
                                    item.id
                                  ) ===
                                  id
                              );

                            return (
                              <span
                                key={id}
                                className="rounded-full bg-white px-2 py-1 text-[9px] font-bold"
                              >
                                {product
                                  ?.name ||
                                  id}
                              </span>
                            );
                          }
                        )}

                      </div>
                    )}

                    {openProducts[
                      section.key
                    ] && (

                      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">

                        <input
                          value={
                            search[
                              section.key
                            ] || ""
                          }
                          onChange={(event) =>
                            setSearch(
                              (value) => ({
                                ...value,
                                [section.key]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Search product / brand / category..."
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                        />

                        <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto md:grid-cols-2">

                          {filteredProducts(
                            section.key
                          ).map(
                            (product: any) => {

                              const id =
                                String(
                                  product.id
                                );

                              const checked =
                                section.productIds.includes(
                                  id
                                );

                              return (
                                <label
                                  key={id}
                                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-100 p-2 hover:bg-zinc-50"
                                >

                                  <input
                                    type="checkbox"
                                    checked={
                                      checked
                                    }
                                    onChange={() =>
                                      toggleProduct(
                                        section.key,
                                        id
                                      )
                                    }
                                  />

                                  <div className="min-w-0">

                                    <p className="truncate text-[10px] font-black">
                                      {product.name ||
                                        product.title ||
                                        "Product"}
                                    </p>

                                    <p className="truncate text-[9px] text-zinc-500">
                                      {product.brandName ||
                                        product.category ||
                                        ""}{" "}
                                      · ₹
                                      {product.price ??
                                        0}
                                    </p>

                                  </div>

                                </label>
                              );
                            }
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                  {/* ==================================
                      CATEGORIES
                  ================================== */}

                  <div className="md:col-span-2 flex items-center justify-between">

                    <p className="text-xs font-black">
                      Categories inside this section
                    </p>

                    <button
                      onClick={() =>
                        addCategory(
                          section.key
                        )
                      }
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black"
                    >
                      + Add Category
                    </button>

                  </div>

                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    {section.categories.map(
                      (category) => (

                        <div
                          key={
                            category.id
                          }
                          className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                        >

                          <div className="flex items-center justify-between">

                            <span className="text-[10px] font-black">
                              Category
                            </span>

                            <button
                              onClick={() =>
                                removeCategory(
                                  section.key,
                                  category.id
                                )
                              }
                              className="text-[10px] font-black text-red-500"
                            >
                              Delete
                            </button>

                          </div>

                          <input
                            value={
                              category.name
                            }
                            onChange={(event) =>
                              updateCategory(
                                section.key,
                                category.id,
                                {
                                  name:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold"
                            placeholder="Vegetables & Fruits"
                          />

                          <div className="mt-2 flex items-center gap-2">

                            <div className="h-14 w-14 overflow-hidden rounded-lg border bg-white">

                              {category.image ? (
                                <img
                                  src={
                                    category.image
                                  }
                                  alt={
                                    category.name
                                  }
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center">
                                  📦
                                </span>
                              )}

                            </div>

                            <label className="cursor-pointer rounded-lg border bg-white px-2 py-2 text-[9px] font-black">

                              Upload Image

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(
                                  event
                                ) =>
                                  handleImage(
                                    section.key,
                                    category.id,
                                    event
                                      .target
                                      .files?.[0]
                                  )
                                }
                              />

                            </label>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </section>

            )
          )}

        </div>

        {/* ============================================
            SAVE
        ============================================ */}

        <div className="sticky bottom-3 mt-5 flex justify-end">

          <button
            onClick={save}
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black shadow-lg"
          >
            {saved
              ? "Saved ✓"
              : "Save Home Categories"}
          </button>

        </div>

        {/* ============================================
            HISTORY
        ============================================ */}

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">

          <div className="flex items-start justify-between gap-3">

            <div>

              <h2 className="text-sm font-black">
                Save History
              </h2>

              <p className="mt-1 text-[10px] text-zinc-500">
                Last saved versions are kept
                in this browser. Restore/Edit
                loads a version into the editor;
                it does not publish until you
                press Save.
              </p>

            </div>

          </div>

          <div className="mt-3 space-y-2">

            {history.length ===
            0 ? (
              <p className="text-xs text-zinc-400">
                No save history yet.
              </p>
            ) : (
              history.map(
                (entry) => {

                  const sectionCount =
                    entry.sections
                      ?.length ||
                    new Set(
                      entry.items.map(
                        (item) =>
                          item.section
                      )
                    ).size;

                  return (
                    <details
                      key={
                        entry.id
                      }
                      className="rounded-xl border border-zinc-200 p-3"
                    >

                      <summary className="cursor-pointer text-xs font-black">
                        {new Date(
                          entry.savedAt
                        ).toLocaleString()}{" "}
                        ·{" "}
                        {
                          sectionCount
                        }{" "}
                        sections
                      </summary>

                      <div className="mt-3 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            restoreHistory(
                              entry
                            )
                          }
                          className="rounded-lg bg-black px-3 py-2 text-[10px] font-black text-white"
                        >
                          Edit / Restore
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteHistory(
                              entry.id
                            )
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black text-red-600"
                        >
                          Delete History
                        </button>

                      </div>

                      <div className="mt-3 space-y-1.5">

                        {entry.sections
                          ?.length ? (
                          entry.sections.map(
                            (
                              section
                            ) => (
                              <div
                                key={`${entry.id}-${section.key}`}
                                className="rounded-lg bg-zinc-50 px-3 py-2"
                              >

                                <p className="text-[10px] font-black text-zinc-800">
                                  {
                                    section.heading
                                  }
                                </p>

                                <p className="text-[9px] text-zinc-500">
                                  {
                                    section.subtitle
                                  }{" "}
                                  ·{" "}
                                  {
                                    section.productIds
                                      .length
                                  }{" "}
                                  products ·{" "}
                                  {
                                   (section.campaignIds || []).length
                                  }{" "}
                                  campaigns
                                </p>

                              </div>
                            )
                          )
                        ) : (
                          Array.from(
                            new Map(
                              entry.items.map(
                                (
                                  item
                                ) => [
                                  item.section,
                                  item,
                                ]
                              )
                            ).values()
                          ).map(
                            (item) => (
                              <div
                                key={`${entry.id}-${item.section}`}
                                className="rounded-lg bg-zinc-50 px-3 py-2"
                              >

                                <p className="text-[10px] font-black text-zinc-800">
                                  {
                                    item.heading
                                  }
                                </p>

                                <p className="text-[9px] text-zinc-500">
                                  {
                                    item.subtitle
                                  }{" "}
                                  ·{" "}
                                  {
                                    new Set(
                                      entry.items
                                        .filter(
                                          (
                                            current
                                          ) =>
                                            current.section ===
                                            item.section
                                        )
                                        .flatMap(
                                          (
                                            current
                                          ) =>
                                            current.productIds
                                        )
                                    ).size
                                  }{" "}
                                  products ·{" "}
                                  {
                                    entry.items.filter(
                                      (
                                        current
                                      ) =>
                                        current.section ===
                                        item.section
                                    ).length
                                  }{" "}
                                  categories
                                </p>

                              </div>
                            )
                          )
                        )}

                      </div>

                    </details>
                  );
                }
              )
            )}

          </div>

        </section>

      </div>
    </main>
  );
}
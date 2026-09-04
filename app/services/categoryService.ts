import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export interface Category {
  id: string;

  name: string;
  nameLower?: string;

  slug?: string;

  parentId?: string | null;
  level?: number;

  icon?: string;
  image?: string;
  banner?: string;

  description?: string;

  active?: boolean;

  featured?: boolean;

  showOnHome?: boolean;

  sortOrder?: number;

  section?: string;

  productCount?: number;

  createdAt?: any;
  updatedAt?: any;

  [key: string]: any;
}

export interface CategoryPage {
  categories: Category[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}

const COLLECTION =
  "categories";

const clean =
  (value: unknown) =>
    String(
      value ?? ""
    ).trim();

const normalize =
  (value: unknown) =>
    clean(value).toLowerCase();

const slugify =
  (value: string) =>
    normalize(value)
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        "" );

const mapCategory = (
  id: string,
  data: DocumentData
): Category => ({
  id,

  ...data,

  name:
    clean(data?.name),

  nameLower:
    normalize(data?.name),

  slug:
    clean(
      data?.slug
    ) ||
    slugify(
      clean(data?.name)
    ),

  active:
    data?.active !== false,

  featured:
    data?.featured === true,

  showOnHome:
    data?.showOnHome === true,

  sortOrder:
    Number(
      data?.sortOrder ??
      data?.order ??
      0
    ),
});

// ======================================================
// GET ALL CATEGORIES
// ======================================================

export const getCategories =
  async (): Promise<Category[]> => {
    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          orderBy(
            "nameLower"
          )
        )
      );

    return snapshot.docs
      .map(
        (item) =>
          mapCategory(
            item.id,
            item.data()
          )
      )
      .filter(
        (category) =>
          category.name
      );
  };

// ======================================================
// PAGINATED CATEGORIES
// ======================================================

export const getCategoriesPage =
  async ({
    pageSize = 50,
    lastDoc = null,
    activeOnly = false,
  }: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
    activeOnly?: boolean;
  } = {}): Promise<CategoryPage> => {
    const safeSize =
      Math.min(
        100,
        Math.max(
          1,
          Math.floor(
            Number(
              pageSize
            ) || 50
          )
        )
      );

    const constraints: any[] = [];

    if (activeOnly) {
      constraints.push(
        where(
          "active",
          "==",
          true
        )
      );
    }

    constraints.push(
      orderBy(
        "nameLower"
      )
    );

    if (lastDoc) {
      constraints.push(
        startAfter(
          lastDoc
        )
      );
    }

    constraints.push(
      limit(
        safeSize + 1
      )
    );

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          ...constraints
        )
      );

    const hasMore =
      snapshot.docs.length >
      safeSize;

    const visible =
      hasMore
        ? snapshot.docs.slice(
            0,
            safeSize
          )
        : snapshot.docs;

    return {
      categories:
        visible.map(
          (item) =>
            mapCategory(
              item.id,
              item.data()
            )
        ),

      hasMore,

      lastDoc:
        visible.length
          ? visible[
              visible.length - 1
            ]
          : null,
    };
  };

// ======================================================
// ADD CATEGORY
// ======================================================

export const addCategory =
  async (
    name: string,
    icon = "",
    image = "",
    section = ""
  ) => {
    const cleanName =
      clean(name);

    if (!cleanName) {
      throw new Error(
        "Category name required"
      );
    }

    const nameLower =
      normalize(
        cleanName
      );

    const duplicate =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          where(
            "nameLower",
            "==",
            nameLower
          ),
          limit(1)
        )
      );

    if (!duplicate.empty) {
      throw new Error(
        "Category already exists"
      );
    }

    const slug =
      slugify(
        cleanName
      );

    return addDoc(
      collection(
        db,
        COLLECTION
      ),
      {
        name:
          cleanName,

        nameLower,

        slug,

        icon:
          clean(icon),

        image:
          clean(image),

        section:
          clean(section),

        active:
          true,

        featured:
          false,

        showOnHome:
          false,

        sortOrder:
          0,

        parentId:
          null,

        level:
          0,

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      }
    );
  };

// ======================================================
// UPDATE CATEGORY
// ======================================================

export const updateCategory =
  async (
    id: string,
    name: string,
    icon = "",
    image = "",
    section = ""
  ) => {
    const cleanName =
      clean(name);

    if (!cleanName) {
      throw new Error(
        "Category name required"
      );
    }

    const nameLower =
      normalize(
        cleanName
      );

    const duplicate =
      await getDocs(
        query(
          collection(
            db,
            COLLECTION
          ),
          where(
            "nameLower",
            "==",
            nameLower
          ),
          limit(5)
        )
      );

    const duplicateExists =
      duplicate.docs.some(
        (item) =>
          item.id !== id
      );

    if (duplicateExists) {
      throw new Error(
        "Category already exists"
      );
    }

    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        name:
          cleanName,

        nameLower,

        slug:
          slugify(
            cleanName
          ),

        icon:
          clean(icon),

        image:
          clean(image),

        section:
          clean(section),

        updatedAt:
          new Date(),
      }
    );
  };

// ======================================================
// UPDATE CATEGORY SETTINGS
// ======================================================

export const updateCategorySettings =
  async (
    id: string,
    changes: Partial<
      Pick<
        Category,
        | "active"
        | "featured"
        | "showOnHome"
        | "sortOrder"
        | "section"
        | "parentId"
        | "level"
        | "banner"
        | "description"
      >
    >
  ) => {
    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        ...changes,

        updatedAt:
          new Date(),
      }
    );
  };

// ======================================================
// DELETE CATEGORY
// ======================================================

export const deleteCategory =
  async (
    id: string
  ) => {
    await deleteDoc(
      doc(
        db,
        COLLECTION,
        id
      )
    );
  };

// ======================================================
// ALL-CATEGORIES PAGE HEADING (admin-editable)
// ======================================================

const CATEGORIES_PAGE_SETTINGS_DOC = "categoriesPage";

export const getCategoriesPageHeading =
  async (): Promise<string> => {
    const snap = await getDoc(doc(db, "settings", CATEGORIES_PAGE_SETTINGS_DOC));
    if (snap.exists()) {
      const heading = clean(snap.data()?.heading);
      if (heading) return heading;
    }
    return "All Categories";
  };

export const setCategoriesPageHeading =
  async (heading: string) => {
    await setDoc(
      doc(db, "settings", CATEGORIES_PAGE_SETTINGS_DOC),
      { heading: clean(heading) || "All Categories", updatedAt: new Date() },
      { merge: true }
    );
  };
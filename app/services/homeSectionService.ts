import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import type {
  HomeSection,
} from "./homeSectionTypes";

const COLLECTION =
  "homeSections";

/* ======================================================
   CACHE
====================================================== */

const HOME_SECTIONS_CACHE_TTL =
  15_000;

let homeSectionsCache:
  | {
      data: HomeSection[];
      expiresAt: number;
    }
  | null = null;

let activeHomeSectionsCache:
  | {
      data: HomeSection[];
      expiresAt: number;
    }
  | null = null;

let homeSectionsRequest:
  | Promise<HomeSection[]>
  | null = null;

let activeHomeSectionsRequest:
  | Promise<HomeSection[]>
  | null = null;

const clearHomeSectionsCache =
  () => {
    homeSectionsCache = null;
    activeHomeSectionsCache = null;
  };

/* ======================================================
   NORMALIZE
====================================================== */

const mapHomeSection = (
  id: string,
  data: any
): HomeSection => ({
  id,
  ...data,
});

/* ======================================================
   GET ALL HOME SECTIONS
   Cached + request deduplication
====================================================== */

export const getHomeSections =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<HomeSection[]> => {
    const forceRefresh =
      options?.forceRefresh === true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      homeSectionsCache &&
      homeSectionsCache.expiresAt >
        now
    ) {
      return homeSectionsCache.data;
    }

    if (
      !forceRefresh &&
      homeSectionsRequest
    ) {
      return homeSectionsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            query(
              collection(
                db,
                COLLECTION
              ),
              orderBy(
                "order",
                "asc"
              )
            )
          );

        const result =
          snapshot.docs.map(
            (item) =>
              mapHomeSection(
                item.id,
                item.data()
              )
          );

        homeSectionsCache = {
          data: result,
          expiresAt:
            Date.now() +
            HOME_SECTIONS_CACHE_TTL,
        };

        return result;
      })();

    homeSectionsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        homeSectionsRequest ===
        request
      ) {
        homeSectionsRequest =
          null;
      }
    }
  };

/* ======================================================
   GET ACTIVE HOME SECTIONS
   Cached + request deduplication
====================================================== */

export const getActiveHomeSections =
  async (
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<HomeSection[]> => {
    const forceRefresh =
      options?.forceRefresh === true;

    const now =
      Date.now();

    if (
      !forceRefresh &&
      activeHomeSectionsCache &&
      activeHomeSectionsCache.expiresAt >
        now
    ) {
      return activeHomeSectionsCache.data;
    }

    if (
      !forceRefresh &&
      activeHomeSectionsRequest
    ) {
      return activeHomeSectionsRequest;
    }

    const request =
      (async () => {
        const snapshot =
          await getDocs(
            query(
              collection(
                db,
                COLLECTION
              ),
              where(
                "active",
                "==",
                true
              ),
              orderBy(
                "order",
                "asc"
              )
            )
          );

        const now =
          new Date();

        const result =
          snapshot.docs
            .map(
              (item) =>
                mapHomeSection(
                  item.id,
                  item.data()
                )
            )
            .filter(
              (section) => {
                if (
                  section.startDate
                ) {
                  const start =
                    new Date(
                      section.startDate
                    );

                  if (
                    now < start
                  ) {
                    return false;
                  }
                }

                if (
                  section.endDate
                ) {
                  const end =
                    new Date(
                      section.endDate
                    );

                  if (
                    now > end
                  ) {
                    return false;
                  }
                }

                return true;
              }
            );

        activeHomeSectionsCache = {
          data: result,
          expiresAt:
            Date.now() +
            HOME_SECTIONS_CACHE_TTL,
        };

        return result;
      })();

    activeHomeSectionsRequest =
      request;

    try {
      return await request;
    } finally {
      if (
        activeHomeSectionsRequest ===
        request
      ) {
        activeHomeSectionsRequest =
          null;
      }
    }
  };

/* ======================================================
   CREATE HOME SECTION
====================================================== */

export const createHomeSection =
  async (
    section: Omit<
      HomeSection,
      "id"
    >
  ) => {
    const ref =
      await addDoc(
        collection(
          db,
          COLLECTION
        ),
        {
          ...section,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    clearHomeSectionsCache();

    return ref.id;
  };

/* ======================================================
   UPDATE HOME SECTION
====================================================== */

export const updateHomeSection =
  async (
    id: string,
    section: Partial<HomeSection>
  ) => {
    await updateDoc(
      doc(
        db,
        COLLECTION,
        id
      ),
      {
        ...section,

        updatedAt:
          new Date(),
      }
    );

    clearHomeSectionsCache();
  };

/* ======================================================
   DELETE HOME SECTION
====================================================== */

export const deleteHomeSection =
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

    clearHomeSectionsCache();
  };
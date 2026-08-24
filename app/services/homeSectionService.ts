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

export const getHomeSections =
  async (): Promise<
    HomeSection[]
  > => {
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

    return snapshot.docs.map(
      (item) =>
        ({
          id: item.id,
          ...item.data(),
        }) as HomeSection
    );
  };

export const getActiveHomeSections =
  async (): Promise<
    HomeSection[]
  > => {
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

    return snapshot.docs
      .map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as HomeSection
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
  };

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

    return ref.id;
  };

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
  };

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
  };
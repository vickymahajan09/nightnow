import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, db } from "../lib/firebase";

/* =====================================================
   CONSTANTS
===================================================== */

const ADMIN_EMAIL = "mahajanvicky04@gmail.com";

/* =====================================================
   TYPES
===================================================== */

export type Campaign = {
  id?: string;

  name: string;
  slug: string;

  banner: string;
  mobileBanner: string;
  desktopBanner: string;

  startDate: string;
  endDate: string;

  categoryIds: string[];
  brandIds: string[];
  productIds: string[];

  offerIds: string[];
  couponCodes: string[];

  sectionPosition: string;

  priority: number;

  active: boolean;

  createdAt?: any;
  updatedAt?: any;
};

export type Banner = {
  id?: string;

  title: string;
  subtitle: string;

  image: string;
  mobileImage: string;
  desktopImage: string;

  linkUrl: string;

  startDate: string;
  endDate: string;

  priority: number;

  active: boolean;

  createdAt?: any;
  updatedAt?: any;
};

/* =====================================================
   HELPERS
===================================================== */

const cleanString = (value: any) =>
  String(value ?? "").trim();

const cleanArray = (value: any) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    : [];

/* =====================================================
   AUTH HELPERS
===================================================== */

const isAdminUser = (user: User | null) => {
  const email = user?.email
    ?.trim()
    .toLowerCase();

  return (
    !!user &&
    email === ADMIN_EMAIL
  );
};

/**
 * Firebase Auth state can take a moment to restore
 * after page refresh/navigation.
 *
 * This waits until Firebase has resolved the
 * current authentication state.
 */
const waitForAuthUser = (): Promise<User | null> => {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let finished = false;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (finished) return;

          finished = true;
          unsubscribe();
          resolve(user);
        }
      );
  });
};

/**
 * Every campaign write passes through this check.
 */
const requireAdmin = async (): Promise<User> => {
  const user = await waitForAuthUser();

  if (!user) {
    throw new Error(
      "ADMIN_NOT_LOGGED_IN"
    );
  }

  if (!isAdminUser(user)) {
    throw new Error(
      "NOT_ADMIN_ACCOUNT"
    );
  }

  return user;
};

/* =====================================================
   CAMPAIGNS
===================================================== */

export const getCampaigns = async (): Promise<
  Campaign[]
> => {
  const snapshot = await getDocs(
    query(
      collection(db, "campaigns"),
      orderBy("priority", "asc")
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Campaign),
  }));
};

/* =====================================================
   ADD CAMPAIGN
===================================================== */

export const addCampaign = async (
  campaign: Omit<
    Campaign,
    "id" | "createdAt" | "updatedAt"
  >
) => {
  await requireAdmin();

  const data = {
    name: cleanString(campaign.name),

    slug: cleanString(campaign.slug),

    banner: cleanString(campaign.banner),

    mobileBanner: cleanString(
      campaign.mobileBanner
    ),

    desktopBanner: cleanString(
      campaign.desktopBanner
    ),

    startDate: cleanString(
      campaign.startDate
    ),

    endDate: cleanString(
      campaign.endDate
    ),

    categoryIds: cleanArray(
      campaign.categoryIds
    ),

    brandIds: cleanArray(
      campaign.brandIds
    ),

    productIds: cleanArray(
      campaign.productIds
    ),

    offerIds: cleanArray(
      campaign.offerIds
    ),

    couponCodes: cleanArray(
      campaign.couponCodes
    ),

    sectionPosition: cleanString(
      campaign.sectionPosition
    ),

    priority: Number(
      campaign.priority || 1
    ),

    active:
      campaign.active !== false,

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  return addDoc(
    collection(db, "campaigns"),
    data
  );
};

/* =====================================================
   UPDATE CAMPAIGN
===================================================== */

export const updateCampaign = async (
  id: string,
  campaign: Partial<Campaign>
) => {
  await requireAdmin();

  if (!id?.trim()) {
    throw new Error(
      "CAMPAIGN_ID_MISSING"
    );
  }

  const updateData: Record<
    string,
    any
  > = {
    updatedAt: new Date(),
  };

  if (
    campaign.name !== undefined
  ) {
    updateData.name =
      cleanString(campaign.name);
  }

  if (
    campaign.slug !== undefined
  ) {
    updateData.slug =
      cleanString(campaign.slug);
  }

  if (
    campaign.banner !== undefined
  ) {
    updateData.banner =
      cleanString(campaign.banner);
  }

  if (
    campaign.mobileBanner !==
    undefined
  ) {
    updateData.mobileBanner =
      cleanString(
        campaign.mobileBanner
      );
  }

  if (
    campaign.desktopBanner !==
    undefined
  ) {
    updateData.desktopBanner =
      cleanString(
        campaign.desktopBanner
      );
  }

  if (
    campaign.startDate !==
    undefined
  ) {
    updateData.startDate =
      cleanString(
        campaign.startDate
      );
  }

  if (
    campaign.endDate !== undefined
  ) {
    updateData.endDate =
      cleanString(
        campaign.endDate
      );
  }

  if (
    campaign.categoryIds !==
    undefined
  ) {
    updateData.categoryIds =
      cleanArray(
        campaign.categoryIds
      );
  }

  if (
    campaign.brandIds !== undefined
  ) {
    updateData.brandIds =
      cleanArray(
        campaign.brandIds
      );
  }

  if (
    campaign.productIds !==
    undefined
  ) {
    updateData.productIds =
      cleanArray(
        campaign.productIds
      );
  }

  if (
    campaign.offerIds !== undefined
  ) {
    updateData.offerIds =
      cleanArray(
        campaign.offerIds
      );
  }

  if (
    campaign.couponCodes !==
    undefined
  ) {
    updateData.couponCodes =
      cleanArray(
        campaign.couponCodes
      );
  }

  if (
    campaign.sectionPosition !==
    undefined
  ) {
    updateData.sectionPosition =
      cleanString(
        campaign.sectionPosition
      );
  }

  if (
    campaign.priority !== undefined
  ) {
    updateData.priority =
      Number(
        campaign.priority || 1
      );
  }

  if (
    campaign.active !== undefined
  ) {
    updateData.active =
      Boolean(campaign.active);
  }

  return updateDoc(
    doc(db, "campaigns", id),
    updateData
  );
};

/* =====================================================
   DELETE CAMPAIGN
===================================================== */

export const deleteCampaign = async (
  id: string
) => {
  await requireAdmin();

  if (!id?.trim()) {
    throw new Error(
      "CAMPAIGN_ID_MISSING"
    );
  }

  return deleteDoc(
    doc(db, "campaigns", id)
  );
};

/* =====================================================
   ACTIVE CAMPAIGNS
===================================================== */

export const getActiveCampaigns =
  async (): Promise<Campaign[]> => {
    const campaigns =
      await getCampaigns();

    const now = Date.now();

    return campaigns
      .filter((campaign) => {
        if (!campaign.active) {
          return false;
        }

        if (campaign.startDate) {
          const start = new Date(
            campaign.startDate
          ).getTime();

          if (
            Number.isFinite(start) &&
            now < start
          ) {
            return false;
          }
        }

        if (campaign.endDate) {
          const end = new Date(
            campaign.endDate
          ).getTime();

          if (
            Number.isFinite(end) &&
            now > end
          ) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(a.priority || 1) -
          Number(b.priority || 1)
      );
  };

/* =====================================================
   BANNERS
===================================================== */

export const getBanners = async (): Promise<
  Banner[]
> => {
  const snapshot = await getDocs(
    query(
      collection(db, "banners"),
      orderBy("priority", "asc")
    )
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Banner),
  }));
};

/* =====================================================
   ADD BANNER
===================================================== */

export const addBanner = async (
  banner: Omit<
    Banner,
    "id" | "createdAt" | "updatedAt"
  >
) => {
  await requireAdmin();

  return addDoc(
    collection(db, "banners"),
    {
      title: cleanString(
        banner.title
      ),

      subtitle: cleanString(
        banner.subtitle
      ),

      image: cleanString(
        banner.image
      ),

      mobileImage: cleanString(
        banner.mobileImage
      ),

      desktopImage: cleanString(
        banner.desktopImage
      ),

      linkUrl: cleanString(
        banner.linkUrl
      ),

      startDate: cleanString(
        banner.startDate
      ),

      endDate: cleanString(
        banner.endDate
      ),

      priority: Number(
        banner.priority || 1
      ),

      active:
        banner.active !== false,

      createdAt: new Date(),

      updatedAt: new Date(),
    }
  );
};

/* =====================================================
   UPDATE BANNER
===================================================== */

export const updateBanner = async (
  id: string,
  banner: Partial<Banner>
) => {
  await requireAdmin();

  if (!id?.trim()) {
    throw new Error(
      "BANNER_ID_MISSING"
    );
  }

  const updateData: Record<
    string,
    any
  > = {
    updatedAt: new Date(),
  };

  if (
    banner.title !== undefined
  ) {
    updateData.title =
      cleanString(banner.title);
  }

  if (
    banner.subtitle !== undefined
  ) {
    updateData.subtitle =
      cleanString(
        banner.subtitle
      );
  }

  if (
    banner.image !== undefined
  ) {
    updateData.image =
      cleanString(banner.image);
  }

  if (
    banner.mobileImage !==
    undefined
  ) {
    updateData.mobileImage =
      cleanString(
        banner.mobileImage
      );
  }

  if (
    banner.desktopImage !==
    undefined
  ) {
    updateData.desktopImage =
      cleanString(
        banner.desktopImage
      );
  }

  if (
    banner.linkUrl !== undefined
  ) {
    updateData.linkUrl =
      cleanString(
        banner.linkUrl
      );
  }

  if (
    banner.startDate !==
    undefined
  ) {
    updateData.startDate =
      cleanString(
        banner.startDate
      );
  }

  if (
    banner.endDate !== undefined
  ) {
    updateData.endDate =
      cleanString(
        banner.endDate
      );
  }

  if (
    banner.priority !== undefined
  ) {
    updateData.priority =
      Number(
        banner.priority || 1
      );
  }

  if (
    banner.active !== undefined
  ) {
    updateData.active =
      Boolean(banner.active);
  }

  return updateDoc(
    doc(db, "banners", id),
    updateData
  );
};

/* =====================================================
   DELETE BANNER
===================================================== */

export const deleteBanner = async (
  id: string
) => {
  await requireAdmin();

  if (!id?.trim()) {
    throw new Error(
      "BANNER_ID_MISSING"
    );
  }

  return deleteDoc(
    doc(db, "banners", id)
  );
};

/* =====================================================
   ACTIVE BANNERS
===================================================== */

export const getActiveBanners =
  async (): Promise<Banner[]> => {
    const banners =
      await getBanners();

    const now = Date.now();

    return banners
      .filter((banner) => {
        if (!banner.active) {
          return false;
        }

        if (banner.startDate) {
          const start = new Date(
            banner.startDate
          ).getTime();

          if (
            Number.isFinite(start) &&
            now < start
          ) {
            return false;
          }
        }

        if (banner.endDate) {
          const end = new Date(
            banner.endDate
          ).getTime();

          if (
            Number.isFinite(end) &&
            now > end
          ) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(a.priority || 1) -
          Number(b.priority || 1)
      );
  };
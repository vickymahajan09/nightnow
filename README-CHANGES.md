# NightNow — 5 Fixes (Hinglish + English)

Is zip mein sirf WOHI files hain jo change/add hui hain. Apne project
mein inhi paths pe **paste/overwrite** kar do (same folder structure
follow karo):

```
app/lib/returnPolicy.ts               <-- NAYI FILE
app/context/WishlistContext.tsx       <-- NAYI FILE
app/layout.tsx                        <-- EDIT
app/product/[id]/ProductClient.tsx    <-- EDIT
app/admin/product/page.tsx            <-- EDIT
app/services/productService.ts        <-- EDIT
app/page.tsx                          <-- EDIT
app/wishlist/page.tsx                 <-- EDIT
```

Baaki koi file touch nahi hui — safe hai.

---

## 1) Wishlist "update failed" bug — FIXED (root cause)

**Problem:** Aapke code mein wishlist ka logic 3 alag jagah alag tarike
se likha tha:
- `ProductClient.tsx` (product detail page ka ♡ button) — "liked"
  status **localStorage** se padhta tha, lekin toggle click par
  **Firestore** mein likhta tha. Dono kabhi sync nahi hote — isiliye
  galat state aur "Wishlist update failed" error aata tha.
- `wishlistService.ts` ka apna alag implementation tha.
- Wishlist listing page (`/wishlist`) ka apna teesra implementation.

**Fix:** Ek naya `WishlistContext` banaya (`app/context/WishlistContext.tsx`)
jo poore app ke liye single source of truth hai — bilkul aapke
`CartContext` jaisa. Ye:
- Login hote hi Firestore se wishlist ek baar load karta hai.
- Har jagah (home card, product page, wishlist page) same state use
  hoti hai — kahin bhi mismatch nahi hoga.
- `app/layout.tsx` mein wire kar diya gaya hai (`<WishlistProvider>`).
- `ProductClient.tsx` ka ♡ button ab isi context se judh gaya hai.
- `/wishlist` page se remove karne par bhi baaki jagah turant sync
  ho jaata hai.

---

## 2) Home page product card — swipe + wishlist + bade +/- buttons

File: `app/page.tsx` (component: `ProductTile` — yahi asli card hai
jo home page use karta hai; baaki `ProductCard.tsx`,
`QuickCommerceProductCard.tsx` files unused/orphan hain, unhe chhoda
hai).

- Agar product ke 2+ images hain, to card par hi **left/right swipe**
  (touch gesture) se image change ho jaati hai, aur neeche chhote
  dots dikhte hain (kaunsi image active hai).
- Card ke top-right corner par ♡ **wishlist heart** add kiya —
  seedha tap karke wishlist mein add/remove kar sakte ho.
- **+ / − buttons bade kiye** (7×7 se badhakar, pehle chhote the).
- Agar product par return/replacement policy set hai, to uska chhota
  icon bottom-left corner par dikhega (hover/long-press par poora
  naam bhi dikhega — "title" attribute).

---

## 3) Product page par saara filled data dikhna — FIXED

File: `app/product/[id]/ProductClient.tsx`

Pehle sirf category, name, price, aur description dikhta tha. Ab
naya **"Product Information"** section add kiya jo admin form mein
jo bhi fill kiya ho wo sab dikhata hai (jo bhi field khaali nahi hai,
sirf wahi row dikhegi):

- Brand, Subcategory, SKU, HSN Code, GST%
- Weight / Unit / Pack Size
- Manufacturer, Country of Origin, Shelf Life, Packaging Type,
  Storage Instructions
- Manufacturing (MFG) Date, Expiry (EXP) Date
- Key Features (bullet list), Ingredients, Usage Instructions,
  Specifications, Tags
- Return/Replacement Policy badge (icon ke saath, price ke neeche)

---

## 4) MFG Date aur EXP Date — ADDED

File: `app/admin/product/page.tsx` (ye hi actual "Add Product" admin
page hai jo dashboard se link hai — `/admin/product/[id]/page.tsx`
aur `/admin/product/list/page.tsx` unused/orphan files hain, unko
chhua nahi).

- Naye 2 date fields add kiye: **Manufacturing (MFG) Date** aur
  **Expiry (EXP) Date** — "Product Details" section mein.
- Product add/edit karte waqt ye save hote hain, aur
  `ProductClient.tsx` par display bhi hote hain (Point 3 dekho).

---

## 5) Return / Replacement Policy dropdown + icons — ADDED

Naya shared file: `app/lib/returnPolicy.ts` — isme saare options
ek jagah defined hain (label + unique icon):

| Policy | Icon |
|---|---|
| 7 Days Replacement | 🔄 |
| 7 Days Return | ↩️ |
| 10 / 15 Days Replacement | 🔄 |
| Easy Return | ↩️ |
| No Return | 🚫 |
| No Exchange | 🚫 |
| No Return, No Exchange | 🚫 |
| No Guarantee / No Warranty | ⚠️ |
| 1 Year / 6 Months Warranty | 🛡️ |
| Non-Returnable (Perishable Item) | 🥬 |

- Admin form mein ab ye **dropdown** hai (pehle plain text box tha),
  taaki galat/inconsistent spelling na ho.
- Product detail page par badge ke roop mein icon + label dikhta hai.
- Home page card par bhi chhota icon dikhta hai (corner mein).
- **Purane products** jinme free-text return policy already saved
  hai, unke liye bhi keyword-matching se best-guess icon dikhega
  (e.g. "no return" likha ho to 🚫 apne aap dikh jaayega) — kuch
  bhi toot nahi ta purane data ke saath.

---

## Testing checklist

1. Kisi bhi product par wishlist ♡ click karo (logged in hote hue) —
   error nahi aana chahiye, aur `/wishlist` page par turant dikhna
   chahiye.
2. Home page par jis product ke multiple images hain, uspar swipe
   karke check karo.
3. Admin → Add Product mein MFG/EXP date fill karke save karo, fir
   uss product ko open karke check karo ki Product Information
   section mein sab dikh raha hai.
4. Return Policy dropdown se koi option select karke save karo,
   product card aur product page dono par icon check karo.

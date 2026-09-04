# Real Browser Push Notifications — Setup Guide

Ab tak sirf **in-app popup** kaam kar raha tha (site khula ho tab hi dikhta
tha). Ye code ab asli **browser/OS-level push notification** bhejta hai —
jaisa Chrome apne aap top pe popup dikhata hai, chahe site/tab band ho.

Code poora likha ja chuka hai. Bas 2 secret cheezein chahiye jo sirf AAP
apne Firebase account se le sakte ho (main ye generate nahi kar sakta,
ye aapke account se juda hota hai).

## Step 1 — VAPID Key (public, browser ke liye)

1. https://console.firebase.google.com par jao → apna project (**night-now-c5617**) kholo
2. ⚙️ **Project Settings** → **Cloud Messaging** tab
3. Neeche **"Web Push certificates"** section me — agar key nahi bani to
   **"Generate key pair"** button dabao
4. Jo key milegi use apne `.env.local` file me daalo:

```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=yahan_wali_key_paste_karo
```

## Step 2 — Service Account (private, server ke liye — push bhejne ke liye)

1. Wahi Firebase console → ⚙️ **Project Settings** → **Service Accounts** tab
2. **"Generate new private key"** button dabao → ek `.json` file download hogi
3. Us file ko **kabhi bhi GitHub/public jagah upload mat karna** — ye poora
   account access deti hai

### Sabse aasan tareeka (RECOMMENDED — quotes/newline ka jhanjhat nahi)

`.env.local` me seedha 3 alag values daalne me `\n` / quotes ka format
bar-bar galat ho raha hai to, iski jagah **poori JSON file ko ek single
base64 text** bana ke daal do — is method me kabhi bhi "Failed to parse
private key" wali error nahi aayegi.

1. PowerShell kholo, jahan `.json` file download hui hai wahan jaake:
   ```
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("night-now-c5617-firebase-adminsdk-xxxxx.json"))
   ```
   (file ka actual naam apna daalna)
2. Jo lamba text output aayega, wo **poora copy karo**
3. `.env.local` me sirf **ek hi line** daalo:
   ```
   FIREBASE_SERVICE_ACCOUNT_BASE64=yahan_wo_lamba_base64_text_paste_karo
   ```
   (isme quotes ki zaroorat nahi hai)

Bas! Ye single line kaam kar degi. Neeche wala "Alternative method"
skip kar sakte ho.

### Alternative method (agar upar wala try nahi karna)

Us JSON file me se 3 values apne `.env.local` me daalo:

```
FIREBASE_ADMIN_PROJECT_ID=night-now-c5617
FIREBASE_ADMIN_CLIENT_EMAIL=json_file_ka_"client_email"_field
FIREBASE_ADMIN_PRIVATE_KEY="json_file_ka_poora_private_key_field_quotes_ke_sath"
```

⚠️ `FIREBASE_ADMIN_PRIVATE_KEY` me `\n` characters hote hain — value ko
seedha JSON file se copy karke double-quotes ke andar paste kar dena,
kuch change karne ki zaroorat nahi. **Ye method fragile hai** — agar
error aaye to upar wala base64 method use karo.

## Step 3 — Package install karo

```
npm install firebase-admin
```

## Step 4 — Test karo

1. `npm run dev` (ya production build) chalao
2. Customer account se website kholo, login karo — browser "Allow
   notifications?" popup dikhayega, **Allow** dabao
3. Ab site ka tab **band kar do** (ya minimize kar do)
4. Admin panel se us customer ke order ka status change karo (jaise
   "Packed" ya "Out for Delivery")
5. Kuch second me Chrome/browser ke top pe OS-level notification popup
   aa jayegi — "Order Packed 📦 — Your order #... has been packed..."

Same admin ke liye bhi kaam karega — jab customer naya order place
karega, admin ko (agar usne notifications allow ki hain) push milegi.

## Nayi/Badli hui files (reference ke liye)

- `public/firebase-messaging-sw.js` — **naya**. Background me push receive
  karne wala service worker (pehle exist hi nahi karta tha).
- `app/lib/firebaseAdmin.ts` — **naya**. Server-side Firebase Admin setup.
- `app/api/admin/send-push/route.ts` — pehle sirf ek khaali stub tha, ab
  real push bhejta hai customer ko.
- `app/api/notifications/admin/route.ts` — **naya**. Ye route already
  code me reference ho raha tha (naya order/cancel/return/exchange pe)
  lekin file exist hi nahi karti thi — isliye admin ki push kabhi jaati
  hi nahi thi. Ab bana di.
- `app/services/orderService.ts` — order status change hone par ab real
  push bhi bhejta hai (pehle sirf in-app Firestore notification banti thi).
- `app/components/CustomerNotificationPopup.tsx` — login hote hi customer
  ka push-token register karta hai (pehle ye kabhi call hi nahi hota tha).
- `app/components/AdminPushNotification.tsx` + `app/admin/layout.tsx` —
  admin login hote hi uska push-token register hota hai (pehle component
  banaya gaya tha lekin kahin use hi nahi ho raha tha).

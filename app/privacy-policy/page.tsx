import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "NightNow's privacy policy — what data we collect, how we use it, and your rights.",
};

const LAST_UPDATED = "3 September 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-800">
      <h1 className="text-3xl font-black text-zinc-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 leading-relaxed">
        This Privacy Policy explains how NightNow ("we", "us", "our")
        collects, uses, shares, and protects your information when you use
        our website and mobile application (together, the "Service"). By
        using the Service, you agree to the practices described here.
      </p>

      <Section title="1. Information We Collect">
        <SubHeading>a. Information you give us</SubHeading>
        <List
          items={[
            "Account details: name, phone number, and email address",
            "Delivery details: address, city, pincode, and your delivery location (latitude/longitude) so we can calculate delivery time and charges",
            "Order details: items purchased, order value, and payment method",
            "Communications: messages you send us via support, reviews, or ratings",
          ]}
        />

        <SubHeading>b. Information collected automatically</SubHeading>
        <List
          items={[
            "Device information: device type, operating system, and app version",
            "Usage data: pages viewed, products browsed, and general app activity, used to improve the Service",
            "Location data: only when you choose to share your location (to show nearby delivery availability and calculate delivery charges)",
            "Push notification token: a device identifier used only to deliver order updates and offers to your device",
          ]}
        />

        <SubHeading>c. Payment information</SubHeading>
        <p className="mt-2">
          Payments are processed by Razorpay, our third-party payment
          partner. We do not store your card, UPI, or bank account details on
          our servers — these are handled directly and securely by Razorpay
          under its own privacy and security policies.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <List
          items={[
            "To process and deliver your orders",
            "To calculate delivery charges and estimated delivery time based on your location",
            "To send order updates via push notification, SMS, or email (e.g. order confirmed, packed, out for delivery, delivered)",
            "To provide customer support and respond to your queries",
            "To send offers, discounts, or promotional messages (you can opt out of these anytime)",
            "To improve our products, app performance, and user experience",
            "To detect and prevent fraud or misuse of the Service",
          ]}
        />
      </Section>

      <Section title="3. Sharing of Information">
        <p>We do not sell your personal information. We only share it with:</p>
        <List
          items={[
            "Delivery partners — your name, phone number, and delivery address, solely to complete your delivery",
            "Payment processor (Razorpay) — to process your payment securely",
            "Cloud service providers (Google Firebase) — for authentication, data storage, and push notifications",
            "Law enforcement or regulators — only when required by applicable law",
          ]}
        />
      </Section>

      <Section title="4. Data Retention">
        <p>
          We retain your account and order information for as long as your
          account is active, or as needed to provide the Service, comply
          with legal obligations, resolve disputes, and enforce our
          agreements. You may request deletion of your account and
          associated data at any time (see Section 6).
        </p>
      </Section>

      <Section title="5. Your Rights">
        <List
          items={[
            "Access the personal data we hold about you",
            "Correct inaccurate information from your profile",
            "Delete your account and associated data",
            "Withdraw location permission at any time from your device settings",
            "Opt out of promotional notifications from the app's notification settings",
          ]}
        />
        <p className="mt-2">
          You can manage or delete your data anytime from{" "}
          <Link href="/account/privacy" className="font-bold text-orange-600 underline">
            Account &gt; Privacy
          </Link>
          , or by writing to us at{" "}
          <a href="mailto:support@nightnow.in" className="font-bold text-orange-600 underline">
            support@nightnow.in
          </a>
          .
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We use industry-standard measures — including encrypted
          connections (HTTPS) and access-controlled cloud infrastructure —
          to protect your information. However, no method of transmission
          or storage is 100% secure, and we cannot guarantee absolute
          security.
        </p>
      </Section>

      <Section title="7. Children's Privacy">
        <p>
          The Service is not directed at children under 18. We do not
          knowingly collect personal information from children. If you
          believe a child has provided us with personal data, please
          contact us so we can remove it.
        </p>
      </Section>

      <Section title="8. Location Permission">
        <p>
          We request your location only to show accurate delivery
          availability, delivery time, and delivery charges for your area.
          Location access is optional — you can deny or revoke it anytime
          from your device settings, though some features (like automatic
          address detection) may not work without it.
        </p>
      </Section>

      <Section title="9. Push Notifications">
        <p>
          We send push notifications for order updates (confirmed, packed,
          out for delivery, delivered) and occasional offers. You can
          disable notifications anytime from your device's app settings.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material
          changes will be notified within the app or via email. Continued
          use of the Service after changes take effect means you accept the
          revised policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          If you have questions about this Privacy Policy or how your data
          is handled, contact us at{" "}
          <a href="mailto:support@nightnow.in" className="font-bold text-orange-600 underline">
            support@nightnow.in
          </a>
          .
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-black text-zinc-900">{title}</h2>
      <div className="mt-2 space-y-2 leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 font-bold text-zinc-900">{children}</p>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

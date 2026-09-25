"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ShopOption = {
  id: string;
  label: string;
  price: number;
  group: string;
};

const OPTIONS: ShopOption[] = [
  { id: "gi_0000", label: "Gi Size 0000", price: 60, group: "Judo Gi" },
  { id: "gi_000", label: "Gi Size 000", price: 60, group: "Judo Gi" },
  { id: "gi_00", label: "Gi Size 00", price: 60, group: "Judo Gi" },
  { id: "gi_0", label: "Gi Size 0", price: 60, group: "Judo Gi" },
  { id: "gi_1", label: "Gi Size 1", price: 65, group: "Judo Gi" },
  { id: "gi_2", label: "Gi Size 2", price: 65, group: "Judo Gi" },
  { id: "gi_3", label: "Gi Size 3", price: 75, group: "Judo Gi" },
  { id: "gi_4", label: "Gi Size 4", price: 75, group: "Judo Gi" },
  { id: "gi_5", label: "Gi Size 5", price: 85, group: "Judo Gi" },
  { id: "gi_6", label: "Gi Size 6", price: 85, group: "Judo Gi" },
  { id: "gi_7", label: "Gi Size 7", price: 85, group: "Judo Gi" },
  { id: "dummy_4", label: "Practice Dummy — 4 ft", price: 50, group: "Practice Dummy" },
  { id: "dummy_5", label: "Practice Dummy — 5 ft", price: 60, group: "Practice Dummy" },
  { id: "dummy_6", label: "Practice Dummy — 6 ft", price: 70, group: "Practice Dummy" },
  { id: "duffle_s", label: "Judo Duffle Bag — Small", price: 65, group: "Duffle Bag" },
  { id: "duffle_l", label: "Judo Duffle Bag — Large", price: 75, group: "Duffle Bag" },
  { id: "tshirt_ys", label: "Youth Small", price: 15, group: "T-Shirt" },
  { id: "tshirt_ym", label: "Youth Medium", price: 15, group: "T-Shirt" },
  { id: "tshirt_yl", label: "Youth Large", price: 16, group: "T-Shirt" },
  { id: "tshirt_as", label: "Adult Small", price: 18, group: "T-Shirt" },
  { id: "tshirt_am", label: "Adult Medium", price: 18, group: "T-Shirt" },
  { id: "tshirt_al", label: "Adult Large", price: 19, group: "T-Shirt" },
  { id: "tshirt_axl", label: "Adult XL", price: 20, group: "T-Shirt" },
  { id: "tshirt_axxl", label: "Adult XXL", price: 22, group: "T-Shirt" },
  { id: "sweat_ys", label: "Youth Small", price: 25, group: "Sweatshirt" },
  { id: "sweat_ym", label: "Youth Medium", price: 25, group: "Sweatshirt" },
  { id: "sweat_yl", label: "Youth Large", price: 26, group: "Sweatshirt" },
  { id: "sweat_as", label: "Adult Small", price: 28, group: "Sweatshirt" },
  { id: "sweat_am", label: "Adult Medium", price: 28, group: "Sweatshirt" },
  { id: "sweat_al", label: "Adult Large", price: 29, group: "Sweatshirt" },
  { id: "sweat_axl", label: "Adult XL", price: 30, group: "Sweatshirt" },
  { id: "sweat_axxl", label: "Adult XXL", price: 32, group: "Sweatshirt" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function ShopPage() {
  const [buyerName, setBuyerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customDescription, setCustomDescription] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(() => {
    const fixed = OPTIONS.reduce((sum, item) => sum + item.price * (quantities[item.id] || 0), 0);
    const custom = Number(customAmount);
    return fixed + (customDescription.trim() && Number.isFinite(custom) && custom > 0 ? custom : 0);
  }, [quantities, customAmount, customDescription]);

  function setQty(id: string, value: number) {
    const quantity = Math.max(0, Math.min(20, Math.floor(value || 0)));
    setQuantities((current) => ({ ...current, [id]: quantity }));
  }

  async function checkout() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          email,
          phone,
          studentName,
          items: OPTIONS.map((item) => ({ id: item.id, quantity: quantities[item.id] || 0 })).filter((item) => item.quantity > 0),
          customDescription,
          customAmount,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Checkout could not be created.");
      if (!data.checkoutUrl) throw new Error("Stripe did not return a checkout link.");
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout could not be created.");
      setSubmitting(false);
    }
  }

  const groups = ["Judo Gi", "Practice Dummy", "Duffle Bag", "T-Shirt", "Sweatshirt"];

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-display uppercase tracking-[0.14em] text-belt mb-2">South Bay Judo</p>
      <h1 className="font-display text-5xl sm:text-6xl mb-4">Order Gear</h1>
      <p className="text-ink/65 max-w-2xl mb-10">
        Already registered? You can order uniforms and club gear here without registering for another session.
      </p>

      <section className="bg-card border border-ink/10 p-6 sm:p-8 mb-8">
        <h2 className="font-display text-2xl mb-5">Who is ordering?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Buyer name *</span>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full border border-ink/20 bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Email *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-ink/20 bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Phone</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-ink/20 bg-white px-3 py-2.5" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Student name <span className="font-normal text-ink/50">(optional)</span></span>
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full border border-ink/20 bg-white px-3 py-2.5" />
          </label>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group} className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-3xl">{group}</h2>
              {group === "Judo Gi" && (
                <p className="text-sm text-ink/60 mt-1">White gi with South Bay Judo embroidery included.</p>
              )}
            </div>
            {group === "Judo Gi" && (
              <a href="/images/fuji-judo-gi-size-chart.png" target="_blank" className="text-sm underline decoration-belt decoration-2 underline-offset-2">
                View size chart
              </a>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {OPTIONS.filter((item) => item.group === group).map((item) => (
              <div key={item.id} className="bg-card border border-ink/10 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-belt font-display text-xl">{money(item.price)}</p>
                </div>
                <label className="text-sm text-right">
                  <span className="block mb-1 text-ink/60">Qty</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={quantities[item.id] || 0}
                    onChange={(e) => setQty(item.id, Number(e.target.value))}
                    className="w-20 border border-ink/20 bg-white px-2 py-2 text-center"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-card border-t-4 border-belt p-6 sm:p-8 mb-8">
        <h2 className="font-display text-3xl mb-2">Other / Special Purchase</h2>
        <p className="text-sm text-ink/65 mb-5">
          Use this only if instructed by South Bay Judo. Enter the item description and the agreed-upon amount.
        </p>
        <div className="grid sm:grid-cols-[1fr_180px] gap-4">
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Item / Description</span>
            <input
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Example: Replacement embroidered jacket"
              className="w-full border border-ink/20 bg-white px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 font-semibold">Amount</span>
            <div className="flex border border-ink/20 bg-white">
              <span className="px-3 py-2.5 text-ink/50">$</span>
              <input
                type="number"
                min="1"
                max="5000"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-1 py-2.5 outline-none"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="border border-ink/15 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <p className="text-sm text-ink/60">Order total</p>
          <p className="font-display text-4xl">{money(total)}</p>
        </div>
        <button
          onClick={checkout}
          disabled={submitting || total <= 0 || !buyerName.trim() || !email.trim()}
          className="bg-belt text-card px-7 py-3 font-display text-lg tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Opening checkout…" : "Continue to Stripe Checkout"}
        </button>
      </section>

      {error && <p className="mt-4 text-belt font-semibold">{error}</p>}
      <p className="mt-5 text-xs text-ink/50">
        Merchandise orders are separate from class registration. Your Stripe checkout will show each item and quantity before payment.
      </p>
    </main>
  );
}

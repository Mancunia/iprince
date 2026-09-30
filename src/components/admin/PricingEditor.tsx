"use client";

import React from "react";
import type { PricingContent, PricingItem, PricingRegion, PricingTier } from "@/lib/services/cmsService";

type Props = {
  value: PricingContent;
  onChange: (next: PricingContent) => void;
};

type TextKey = {
  [K in keyof PricingContent]: PricingContent[K] extends string ? K : never;
}[keyof PricingContent];

const inputClass =
  "w-full bg-[#0B192C] border border-[#1E293B] focus:border-gold-500 rounded-lg px-3 py-2 text-xs text-white outline-none";

const REGION_LABELS: Record<PricingRegion, string> = {
  germany: "Recruitment within Germany",
  international: "International Recruitment",
};

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function BilingualField({
  label,
  de,
  en,
  rows,
  onChange,
}: {
  label: string;
  de: string;
  en: string;
  rows?: number;
  onChange: (lang: "de" | "en", text: string) => void;
}) {
  const Field = rows ? "textarea" : "input";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{label} (DE)</label>
        <Field rows={rows} value={de} onChange={(e) => onChange("de", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{label} (EN)</label>
        <Field rows={rows} value={en} onChange={(e) => onChange("en", e.target.value)} className={inputClass} />
      </div>
    </div>
  );
}

function RowControls({
  onUp,
  onDown,
  onRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button type="button" onClick={onUp} aria-label="Move up" className="px-2 py-1 text-slate-400 hover:text-white">
        ↑
      </button>
      <button type="button" onClick={onDown} aria-label="Move down" className="px-2 py-1 text-slate-400 hover:text-white">
        ↓
      </button>
      <button
        type="button"
        onClick={() => confirm("Remove this entry?") && onRemove()}
        className="px-2 py-1 text-slate-400 hover:text-red-400"
      >
        Remove
      </button>
    </div>
  );
}

function ItemList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: PricingItem[];
  onChange: (items: PricingItem[]) => void;
}) {
  const update = (idx: number, patch: Partial<PricingItem>) =>
    onChange(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, { id: `item-${Date.now()}`, text_de: "", text_en: "" }])}
          className="text-xs font-semibold text-gold-400 hover:text-gold-300"
        >
          + Add
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            value={item.text_de}
            onChange={(e) => update(idx, { text_de: e.target.value })}
            placeholder="Deutsch"
            className={inputClass}
          />
          <input
            value={item.text_en}
            onChange={(e) => update(idx, { text_en: e.target.value })}
            placeholder="English"
            className={inputClass}
          />
          <RowControls
            onUp={() => onChange(move(items, idx, idx - 1))}
            onDown={() => onChange(move(items, idx, idx + 1))}
            onRemove={() => onChange(items.filter((_, i) => i !== idx))}
          />
        </div>
      ))}
    </div>
  );
}

export default function PricingEditor({ value, onChange }: Props) {
  const setText = (base: string) => (lang: "de" | "en", text: string) =>
    onChange({ ...value, [`${base}_${lang}` as TextKey]: text });

  const updateTier = (idx: number, patch: Partial<PricingTier>) =>
    onChange({ ...value, tiers: value.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });

  const addTier = () =>
    onChange({
      ...value,
      tiers: [
        ...value.tiers,
        {
          id: `tier-${Date.now()}`,
          region: "germany",
          title_de: "",
          title_en: "",
          description_de: "",
          description_en: "",
          price_from: 0,
          enabled: false,
        },
      ],
    });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div>
          <h2 className="text-base font-bold text-white">Pricing & Services</h2>
          <p className="text-xs text-slate-400">Success-based fees shown to employers. Prices are in EUR, net.</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="accent-gold-500"
          />
          {value.enabled ? "Visible on site" : "Hidden"}
        </label>
      </div>

      <div className="space-y-4">
        <BilingualField label="Headline" de={value.headline_de} en={value.headline_en} onChange={setText("headline")} />
        <BilingualField label="Intro" de={value.intro_de} en={value.intro_en} rows={2} onChange={setText("intro")} />
        <BilingualField
          label="Price suffix"
          de={value.price_suffix_de}
          en={value.price_suffix_en}
          onChange={setText("price_suffix")}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">Tiers</h3>
          <button type="button" onClick={addTier} className="text-xs font-semibold text-gold-400 hover:text-gold-300">
            + Add tier
          </button>
        </div>

        {value.tiers.map((tier, idx) => (
          <div
            key={tier.id}
            className={`p-4 rounded-xl bg-[#070F1E] border border-[#1E293B] space-y-4 ${tier.enabled ? "" : "opacity-60"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={tier.region}
                  onChange={(e) => updateTier(idx, { region: e.target.value as PricingRegion })}
                  className="bg-[#0B192C] border border-[#1E293B] rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {Object.entries(REGION_LABELS).map(([region, label]) => (
                    <option key={region} value={region}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  From €
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={tier.price_from}
                    onChange={(e) => updateTier(idx, { price_from: Number(e.target.value) })}
                    className="w-24 bg-[#0B192C] border border-[#1E293B] rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tier.enabled}
                    onChange={(e) => updateTier(idx, { enabled: e.target.checked })}
                    className="accent-gold-500"
                  />
                  Visible
                </label>
              </div>
              <RowControls
                onUp={() => onChange({ ...value, tiers: move(value.tiers, idx, idx - 1) })}
                onDown={() => onChange({ ...value, tiers: move(value.tiers, idx, idx + 1) })}
                onRemove={() => onChange({ ...value, tiers: value.tiers.filter((_, i) => i !== idx) })}
              />
            </div>

            <BilingualField
              label="Title"
              de={tier.title_de}
              en={tier.title_en}
              onChange={(lang, text) => updateTier(idx, { [`title_${lang}`]: text })}
            />
            <BilingualField
              label="Description"
              de={tier.description_de}
              en={tier.description_en}
              rows={2}
              onChange={(lang, text) => updateTier(idx, { [`description_${lang}`]: text })}
            />
          </div>
        ))}
      </div>

      <ItemList title="What is included" items={value.included} onChange={(included) => onChange({ ...value, included })} />
      <ItemList
        title="International add-ons (agreed separately)"
        items={value.addons}
        onChange={(addons) => onChange({ ...value, addons })}
      />

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">Principle & small print</h3>
        <BilingualField label="Principle" de={value.principle_de} en={value.principle_en} onChange={setText("principle")} />
        <BilingualField
          label="Candidate note"
          de={value.candidate_note_de}
          en={value.candidate_note_en}
          rows={2}
          onChange={setText("candidate_note")}
        />
        <BilingualField
          label="Disclaimer"
          de={value.disclaimer_de}
          en={value.disclaimer_en}
          rows={3}
          onChange={setText("disclaimer")}
        />
      </div>
    </div>
  );
}

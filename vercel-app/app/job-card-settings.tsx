"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultJobCardFields,
  jobCardFieldOptions,
  type JobCardFieldKey,
} from "@/lib/job-card-fields";

export default function JobCardSettings() {
  const [visible, setVisible] =
      useState<JobCardFieldKey[]>(defaultJobCardFields),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/job-card-preferences")
      .then((response) => response.json())
      .then((data) => setVisible(data.visibleFields ?? defaultJobCardFields))
      .catch(() => {});
  }, []);
  const hidden = jobCardFieldOptions.filter(
    (field) => !visible.includes(field.key),
  );
  function toggle(key: JobCardFieldKey) {
    setVisible((current) =>
      current.includes(key)
        ? current.filter((field) => field !== key)
        : [...current, key],
    );
  }
  function move(index: number, direction: -1 | 1) {
    setVisible((current) => {
      const next = [...current],
        target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/job-card-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleFields: visible }),
    });
    setSaving(false);
    setMessage(
      response.ok ? "Job-card view saved." : "The view could not be saved.",
    );
  }
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Job-card display</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose the standard information shown on Job Board cards and arrange
            it in the order your team needs.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving…" : "Save card view"}
        </Button>
      </div>
      {message && (
        <p className="text-sm font-semibold text-emerald-700">{message}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border">
          <div className="bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Visible on cards
          </div>
          {visible.map((key, index) => {
            const field = jobCardFieldOptions.find((item) => item.key === key);
            if (!field) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-2 border-t px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">
                  {field.label}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={index === visible.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggle(key)}
                  aria-label="Hide field"
                >
                  <EyeOff className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <div className="overflow-hidden rounded-xl border">
          <div className="bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            Hidden fields
          </div>
          {hidden.map((field) => (
            <button
              key={field.key}
              type="button"
              onClick={() => toggle(field.key)}
              className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:bg-emerald-50"
            >
              <Eye className="size-4 text-emerald-700" />
              <span className="font-medium">{field.label}</span>
            </button>
          ))}
          {!hidden.length && (
            <p className="p-5 text-sm text-slate-500">
              All fields are visible.
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Custom fields are controlled separately with “Show on job cards” below.
      </p>
    </section>
  );
}

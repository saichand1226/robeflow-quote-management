"use client";
import { useEffect, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CustomFieldDefinition,
  CustomFieldType,
} from "@/lib/custom-fields";

const blank = {
  label: "",
  fieldType: "text" as CustomFieldType,
  options: [] as string[],
  required: false,
  showNewQuote: true,
  showDashboard: false,
  showJobCard: false,
  active: true,
  sortOrder: 0,
};

export default function CustomFieldSettings() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]),
    [form, setForm] = useState<any>(blank),
    [options, setOptions] = useState(""),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    const r = await fetch("/api/custom-fields");
    if (r.ok) setFields((await r.json()).fields ?? []);
  }
  useEffect(() => {
    load();
  }, []);
  function edit(field: CustomFieldDefinition) {
    setForm(field);
    setOptions((field.options ?? []).join("\n"));
    setMessage("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
        ...form,
        options: options
          .split(/\n|,/)
          .map((value) => value.trim())
          .filter(Boolean),
        sortOrder: form.id ? form.sortOrder : fields.length,
      },
      r = await fetch("/api/custom-fields", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      d = await r.json();
    setSaving(false);
    if (!r.ok) {
      setMessage(d.error || "The field could not be saved.");
      return;
    }
    setForm(blank);
    setOptions("");
    setMessage("Custom field saved.");
    load();
  }
  async function update(
    field: CustomFieldDefinition,
    changes: Partial<CustomFieldDefinition>,
  ) {
    await fetch("/api/custom-fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...field, ...changes }),
    });
    load();
  }
  async function archive(field: CustomFieldDefinition) {
    if (
      !confirm(`Archive ${field.label}? Existing job information will be kept.`)
    )
      return;
    await fetch("/api/custom-fields", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: field.id }),
    });
    load();
  }
  async function move(field: CustomFieldDefinition, direction: -1 | 1) {
    const active = fields.filter((item) => item.active),
      index = active.findIndex((item) => item.id === field.id),
      other = active[index + direction];
    if (!other) return;
    await Promise.all([
      update(field, { sortOrder: other.sortOrder }),
      update(other, { sortOrder: field.sortOrder }),
    ]);
  }
  const active = fields.filter((field) => field.active),
    archived = fields.filter((field) => !field.active);
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Custom fields and visibility</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add information your team needs and choose where it appears. Archiving
          a field keeps its historical job values.
        </p>
      </div>
      <form
        onSubmit={save}
        className="grid gap-4 rounded-xl border bg-slate-50 p-4 md:grid-cols-2"
      >
        <div className="grid gap-2">
          <Label>Field label</Label>
          <Input
            required
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. Builder reference"
          />
        </div>
        <div className="grid gap-2">
          <Label>Field type</Label>
          <select
            className="h-10 rounded-md border bg-white px-3 text-sm"
            value={form.fieldType}
            onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Yes / No</option>
            <option value="select">Dropdown list</option>
          </select>
        </div>
        {form.fieldType === "select" && (
          <div className="grid gap-2 md:col-span-2">
            <Label>Dropdown options — one per line</Label>
            <textarea
              required
              className="min-h-24 rounded-md border bg-white p-3 text-sm"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder={"Option one\nOption two"}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-4 md:col-span-2">
          <Check
            label="Required in New Quote"
            checked={form.required}
            onChange={(required) => setForm({ ...form, required })}
          />
          <Check
            label="Show in New Quote"
            checked={form.showNewQuote}
            onChange={(showNewQuote) => setForm({ ...form, showNewQuote })}
          />
          <Check
            label="Show on dashboard"
            checked={form.showDashboard}
            onChange={(showDashboard) => setForm({ ...form, showDashboard })}
          />
          <Check
            label="Show on job cards"
            checked={form.showJobCard}
            onChange={(showJobCard) => setForm({ ...form, showJobCard })}
          />
        </div>
        <div className="flex items-center justify-between md:col-span-2">
          <span
            className={`text-sm font-semibold ${message.includes("saved") ? "text-emerald-700" : "text-red-600"}`}
          >
            {message}
          </span>
          <div className="flex gap-2">
            {form.id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(blank);
                  setOptions("");
                }}
              >
                Cancel edit
              </Button>
            )}
            <Button disabled={saving}>
              <Plus className="size-4" />
              {saving ? "Saving…" : form.id ? "Update field" : "Add field"}
            </Button>
          </div>
        </div>
      </form>
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[1fr_auto] bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
          <span>Active fields</span>
          <span>Actions</span>
        </div>
        {active.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center justify-between gap-4 border-t p-4"
          >
            <div>
              <p className="font-semibold">{field.label}</p>
              <p className="text-xs text-slate-500">
                {field.fieldType} · {field.required ? "Required" : "Optional"} ·{" "}
                {[
                  field.showNewQuote && "New Quote",
                  field.showDashboard && "Dashboard",
                  field.showJobCard && "Job cards",
                ]
                  .filter(Boolean)
                  .join(", ") || "Hidden from users"}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === 0}
                onClick={() => move(field, -1)}
                aria-label="Move up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === active.length - 1}
                onClick={() => move(field, 1)}
                aria-label="Move down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => edit(field)}
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-red-600"
                onClick={() => archive(field)}
                aria-label="Archive"
              >
                <Archive className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {!active.length && (
          <p className="p-6 text-sm text-slate-500">No custom fields yet.</p>
        )}
      </div>
      {archived.length > 0 && (
        <details className="rounded-xl border">
          <summary className="cursor-pointer p-4 font-semibold">
            Archived fields ({archived.length})
          </summary>
          <div className="divide-y">
            {archived.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-4"
              >
                <span>{field.label}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => update(field, { active: true })}
                >
                  <RotateCcw className="size-4" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-emerald-700"
      />
      {label}
    </label>
  );
}

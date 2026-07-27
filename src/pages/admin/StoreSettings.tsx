import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AssetPicker } from "@/components/admin/AssetPicker";
import { branding as brandingDefaults } from "@/config/branding";
import { business as businessDefaults } from "@/config/business";
import type { BusinessHours, SocialLinks } from "@/config/business";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { validateStoreSettings } from "@/lib/storeSettingsValidation";
import type { StoreSettingsFormErrors } from "@/lib/storeSettingsValidation";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

interface FormState {
  businessName: string;
  tagline: string;
  businessDescription: string;
  logo: string;
  logoAlt: string;
  favicon: string;
  legalName: string;
  address: string;
  email: string;
  phone: string;
  responseTime: string;
  googleMapsUrl: string;
  hours: BusinessHours[];
  social: SocialLinks;
}

function stateFrom(branding: typeof brandingDefaults, business: typeof businessDefaults): FormState {
  return {
    businessName: branding.businessName,
    tagline: branding.tagline,
    businessDescription: branding.businessDescription,
    logo: branding.logo,
    logoAlt: branding.logoAlt,
    favicon: branding.favicon,
    legalName: business.legalName,
    address: business.address,
    email: business.email,
    phone: business.phone ?? "",
    responseTime: business.responseTime,
    googleMapsUrl: business.googleMapsUrl ?? "",
    hours: business.hours.map((row) => ({ ...row })),
    social: { ...business.social },
  };
}

/**
 * Phase 16 - Store Settings, the first real admin editor. Lets an admin
 * edit `config/branding.ts` (business name/tagline/description) and
 * `config/business.ts` (contact info) fields through a form instead of
 * hand-editing those files, persisting to `localStorage` via
 * `lib/storeSettingsStore.ts` and reflected live by every component that
 * reads config through `useStoreSettings()` (Navbar, Footer, Contact, the
 * admin shell itself).
 *
 * Saved values are layered over the static defaults ("override ?? default"),
 * never replacing them outright - "Reset to defaults" clears the override
 * entirely rather than writing the defaults back as an override, so the
 * distinction between "customized" and "using the template default" is
 * never lost.
 */
export function StoreSettings() {
  useSiteMeta(PAGE_META.adminStoreSettings);
  const { branding, business, save, reset, isOverridden } = useStoreSettings();

  const [form, setForm] = useState<FormState>(() => stateFrom(branding, business));
  const [errors, setErrors] = useState<StoreSettingsFormErrors>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  function updateSocial<K extends keyof SocialLinks>(key: K, value: string) {
    setForm((prev) => ({ ...prev, social: { ...prev.social, [key]: value || undefined } }));
    setSavedAt(null);
  }

  function updateHoursRow(index: number, field: keyof BusinessHours, value: string) {
    setForm((prev) => ({
      ...prev,
      hours: prev.hours.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
    setSavedAt(null);
  }

  function addHoursRow() {
    setForm((prev) => ({ ...prev, hours: [...prev.hours, { days: "", hours: "" }] }));
  }

  function removeHoursRow(index: number) {
    setForm((prev) => ({ ...prev, hours: prev.hours.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateStoreSettings({ businessName: form.businessName, email: form.email });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    save({
      businessName: form.businessName.trim(),
      tagline: form.tagline.trim(),
      businessDescription: form.businessDescription.trim(),
      logo: form.logo,
      logoAlt: form.logoAlt.trim(),
      favicon: form.favicon,
      legalName: form.legalName.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      responseTime: form.responseTime.trim(),
      googleMapsUrl: form.googleMapsUrl.trim() || undefined,
      hours: form.hours.filter((row) => row.days.trim() || row.hours.trim()),
      social: form.social,
    });
    setSavedAt(Date.now());
  }

  function handleReset() {
    reset();
    setForm(stateFrom(brandingDefaults, businessDefaults));
    setErrors({});
    setSavedAt(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Store Settings" align="left" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RotateCcw size={16} />}
          onClick={handleReset}
          disabled={!isOverridden}
        >
          Reset to defaults
        </Button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Branding</h2>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Logo</p>
            <AssetPicker value={form.logo} onSelect={(dataUrl) => updateField("logo", dataUrl)} label="Choose logo" />
          </div>
          <Input
            label="Logo alt text"
            value={form.logoAlt}
            onChange={(e) => updateField("logoAlt", e.target.value)}
            hint="Read by screen readers - describe the logo, not the business."
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Favicon</p>
            <AssetPicker
              value={form.favicon}
              onSelect={(dataUrl) => updateField("favicon", dataUrl)}
              label="Choose favicon"
              hint="A small square image works best - it's shown at browser-tab size."
            />
          </div>
          <Input
            label="Business name"
            value={form.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            error={errors.businessName}
          />
          <Input
            label="Tagline"
            value={form.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            hint="Shown near the logo and in the footer."
          />
          <div>
            <Textarea
              label="Description"
              value={form.businessDescription}
              onChange={(e) => updateField("businessDescription", e.target.value)}
            />
            <p className="mt-1.5 text-sm text-ink-soft">
              Used as the default page description for search engines and social previews.
            </p>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Business info</h2>
          <Input
            label="Legal name"
            value={form.legalName}
            onChange={(e) => updateField("legalName", e.target.value)}
          />
          <Textarea
            label="Address"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
          <Input
            label="Google Maps URL"
            value={form.googleMapsUrl}
            onChange={(e) => updateField("googleMapsUrl", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="email"
              label="Contact email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <Input
            label="Typical response time"
            value={form.responseTime}
            onChange={(e) => updateField("responseTime", e.target.value)}
            hint='Shown on the Contact page, e.g. "Usually within 1 business day".'
          />
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Business hours</h2>
          {form.hours.length === 0 && (
            <p className="text-sm text-ink-soft">No hours added yet.</p>
          )}
          {form.hours.map((row, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1">
                <Input
                  label="Days"
                  value={row.days}
                  onChange={(e) => updateHoursRow(index, "days", e.target.value)}
                  placeholder="Monday - Saturday"
                />
              </div>
              <div className="min-w-[10rem] flex-1">
                <Input
                  label="Hours"
                  value={row.hours}
                  onChange={(e) => updateHoursRow(index, "hours", e.target.value)}
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                aria-label={`Remove hours row ${index + 1}`}
                onClick={() => removeHoursRow(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus size={16} />}
            onClick={addHoursRow}
            className="self-start"
          >
            Add hours row
          </Button>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Social links</h2>
          <Input
            label="Facebook URL"
            value={form.social.facebook ?? ""}
            onChange={(e) => updateSocial("facebook", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Instagram URL"
              value={form.social.instagram ?? ""}
              onChange={(e) => updateSocial("instagram", e.target.value)}
            />
            <Input
              label="Instagram handle"
              value={form.social.instagramHandle ?? ""}
              onChange={(e) => updateSocial("instagramHandle", e.target.value)}
              placeholder="@yourbusiness"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="TikTok URL"
              value={form.social.tiktok ?? ""}
              onChange={(e) => updateSocial("tiktok", e.target.value)}
            />
            <Input
              label="Messenger URL"
              value={form.social.messenger ?? ""}
              onChange={(e) => updateSocial("messenger", e.target.value)}
            />
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - changes are live across the site.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

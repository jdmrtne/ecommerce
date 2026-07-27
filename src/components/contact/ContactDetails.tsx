import { useState } from "react";
import type { FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { getContactPoints } from "@/content/contact";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const DEFAULT_SETTINGS = { padding: "sm", background: "transparent", width: "medium", align: "left" } as const;

type Status = "idle" | "loading" | "success";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

function validateContact(data: { name: string; email: string; message: string }): ContactErrors {
  const errors: ContactErrors = {};
  if (!data.name.trim()) errors.name = "Please enter your name.";
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "Please enter a valid email address.";
  if (!data.message.trim()) errors.message = "Please enter a message.";
  return errors;
}

/**
 * No backend exists yet for the contact form, so this simulates the
 * request - same fake-latency pattern Newsletter's subscribe() uses.
 */
async function sendMessage(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
}

/**
 * Info cards + message form for `/contact`. Kept as one section (rather
 * than two independently reorderable ones) because they form a single
 * side-by-side grid in the current design - splitting them further would
 * require redesigning the layout, which is out of scope for Phase 11.
 * `settings` still controls this section's own padding/background/width.
 */
export function ContactDetails({ settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);
  const { business } = useStoreSettings();
  const contactPoints = getContactPoints(business);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateContact({ name, email, message });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("loading");
    await sendMessage();
    setStatus("success");
  }

  return (
    <section className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widthClass(s))}>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {contactPoints.map(({ icon: Icon, label, value, href }) => (
              <Card key={label} padding="lg" className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-denim-tint">
                  <Icon className="text-denim" size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="font-semibold text-ink hover:text-denim"
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="font-semibold text-ink">{value}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card padding="lg" className="lg:col-span-3">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-denim-deep">
                <CircleCheck size={32} />
                <p className="font-semibold">Message sent!</p>
                <p className="text-sm text-ink-soft">We&apos;ll get back to you within a business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input
                  label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  disabled={status === "loading"}
                />
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={status === "loading"}
                />
                <Textarea
                  label="Message"
                  placeholder="Tell us what you need..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  error={errors.message}
                  disabled={status === "loading"}
                />
                <Button type="submit" size="lg" isLoading={status === "loading"} className="mt-1 self-start">
                  Send message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

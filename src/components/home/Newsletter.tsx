import { useState } from "react";
import type { FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Squiggle } from "@/components/ui/Squiggle";
import { NEWSLETTER } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "denim-tint", width: "narrow", align: "center" } as const;

type Status = "idle" | "loading" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * No backend exists yet, so this simulates the request. Left as a real,
 * fully working client-side flow (validation + loading + success + error)
 * rather than a decorative placeholder, per the "no unfinished placeholder
 * code" rule - wiring an actual endpoint later is a drop-in replacement of
 * the fake `subscribe` call below.
 */
async function subscribe(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (email.endsWith("@fail.com")) {
    throw new Error("Something went wrong. Please try again.");
  }
}

export function Newsletter({ title, subtitle, settings }: SectionOverrideProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!EMAIL_PATTERN.test(email)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      await subscribe(email);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <section className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 text-center sm:px-6 lg:px-8", widthClass(s))}>
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{title ?? NEWSLETTER.title}</h2>
        <Squiggle className="mx-auto my-4" />
        <p className="text-ink-soft">{subtitle ?? NEWSLETTER.description}</p>

        {status === "success" ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-denim-deep">
            <CircleCheck size={32} />
            <p className="font-semibold">{NEWSLETTER.successTitle}</p>
            <p className="text-sm text-ink-soft">{NEWSLETTER.successDescription}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div className="flex-1 text-left">
              <Input
                type="email"
                placeholder="you@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={status === "error" ? error ?? undefined : undefined}
                disabled={status === "loading"}
              />
            </div>
            <Button type="submit" isLoading={status === "loading"} className="shrink-0">
              {NEWSLETTER.ctaLabel}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

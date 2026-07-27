import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { Squiggle } from "@/components/ui/Squiggle";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { useFooterSettings } from "@/hooks/useFooterSettings";
import type { BusinessConfig } from "@/config/business";
import { cn } from "@/lib/cn";

/**
 * Phase 12: layout switches on the active preset's `footerStyle`
 * (`config/presets/`) - `columns` (the original Phase 1-11 layout: logo
 * column + one column per footer link group), `stacked` (every group
 * centered in one column, links flattened into a single wrapped row per
 * group instead of a grid), or `minimal` (logo, social links, and
 * copyright only - no link groups, no squiggle, tighter padding). All
 * three read from the same `branding`/`business`/footer-link-group data -
 * only the arrangement differs.
 *
 * `branding`/`business` come from `useStoreSettings()` (Phase 16) rather
 * than a static import, so a Store Settings save is reflected here the
 * next time this component renders - no reload required. Footer link
 * groups and the copyright-line name come from `useFooterSettings()`
 * (Phase 22) the same way, replacing the static `FOOTER_LINK_GROUPS`
 * import and `branding.copyrightHolder` respectively.
 */
export function Footer() {
  const { activePreset } = useThemeSettings();
  const footerStyle = activePreset.footerStyle;
  const { branding, business } = useStoreSettings();
  const { linkGroups, copyrightHolder } = useFooterSettings();

  if (footerStyle === "minimal") {
    return (
      <footer className="border-t border-beige bg-beige/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label={`${branding.businessName} home`}>
            <img src={branding.logo} alt={branding.logoAlt} className="h-10 w-auto" />
          </Link>
          <SocialLinks className="justify-center" business={business} />
          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} {copyrightHolder}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  if (footerStyle === "stacked") {
    return (
      <footer className="border-t border-beige bg-beige/40">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-12 text-center sm:px-6 lg:px-8">
          <div>
            <img src={branding.logo} alt={branding.logoAlt} className="mx-auto mb-3 h-16 w-auto" />
            <p className="mx-auto max-w-xs text-sm text-ink-soft">{branding.tagline}</p>
            <SocialLinks className="mt-4 justify-center" business={business} />
          </div>

          <div className="flex flex-col items-center gap-6">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 text-sm font-semibold text-ink">{group.title}</h3>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-soft transition-colors hover:text-denim"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Squiggle className="mx-auto" />

          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} {copyrightHolder}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  // "columns" - the original Phase 1-11 layout.
  return (
    <footer className="border-t border-beige bg-beige/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <img src={branding.logo} alt={branding.logoAlt} className="mb-3 h-16 w-auto" />
            <p className="max-w-xs text-sm text-ink-soft">{branding.tagline}</p>
            <SocialLinks className="mt-4" business={business} />
          </div>

          {linkGroups.map((group) => (
            <FooterColumn key={group.title} title={group.title} links={group.links} />
          ))}
        </div>

        <Squiggle className="mx-auto my-8" />

        <p className="text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} {copyrightHolder}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-sm text-ink-soft transition-colors hover:text-denim"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLinks({ className, business }: { className?: string; business: BusinessConfig }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {business.social.facebook && (
        <SocialLink href={business.social.facebook} label="Facebook">
          <FacebookIcon />
        </SocialLink>
      )}
      {business.social.instagram && (
        <SocialLink href={business.social.instagram} label="Instagram">
          <InstagramIcon />
        </SocialLink>
      )}
      <SocialLink href={`mailto:${business.email}`} label="Email">
        <Mail size={18} />
      </SocialLink>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.86c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-full bg-surface p-2 text-ink-soft shadow-soft transition-colors hover:text-bloom"
    >
      {children}
    </a>
  );
}

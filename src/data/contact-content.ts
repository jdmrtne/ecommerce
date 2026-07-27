import { Mail, AtSign, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ContactPoint {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

export const CONTACT_POINTS: ContactPoint[] = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@crafteevee.com",
    href: "mailto:hello@crafteevee.com",
  },
  {
    icon: AtSign,
    label: "Instagram DMs",
    value: "@crafteevee",
    href: "#",
  },
  {
    icon: Clock,
    label: "Response time",
    value: "Usually within 1 business day",
  },
];

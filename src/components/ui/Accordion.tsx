import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  className?: string;
}

/**
 * Single-open accordion. Each trigger is a real <button> with aria-expanded
 * and aria-controls so it's keyboard and screen-reader accessible; content
 * height animates via grid-template-rows so it never clips or jumps.
 */
export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={cn("flex flex-col divide-y divide-beige", className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
        />
      ))}
    </div>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItemData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
      >
        <span className="font-semibold text-ink">{item.question}</span>
        <ChevronDown
          size={20}
          className={cn(
            "shrink-0 text-denim transition-transform duration-300 ease-out",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="min-h-0">
          <p className="pb-4 pr-8 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Andrea M.",
    location: "Cebu City",
    rating: 5,
    quote:
      "The resin earrings are even prettier in person, and they came wrapped like a little gift. You can tell someone actually made these by hand.",
  },
  {
    id: "t2",
    name: "Kyle R.",
    location: "Quezon City",
    rating: 5,
    quote:
      "Ordered the amigurumi cat for my daughter's birthday. The stitching is so neat and it arrived earlier than the estimate. Will order again.",
  },
  {
    id: "t3",
    name: "Mikaela S.",
    location: "Davao City",
    rating: 4,
    quote:
      "Lovely packaging and the candle smells amazing without being overpowering. Wish they restocked the lavender scent faster!",
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "faq-shipping",
    question: "How long does shipping take?",
    answer:
      "Orders within Metro Manila usually arrive in 2-3 business days; other provinces take 4-7 business days. Each piece is made in small batches, so made-to-order items may add 1-2 extra days before they ship.",
  },
  {
    id: "faq-custom",
    question: "Can I request a custom color or personalization?",
    answer:
      "Yes! Most resin and crochet pieces can be customized in color or with a small initial charm. Leave a note at checkout or message us beforehand so we can confirm it's possible for that item.",
  },
  {
    id: "faq-care",
    question: "How do I take care of my resin or crochet piece?",
    answer:
      "Keep resin pieces out of direct, prolonged sunlight to prevent yellowing, and wipe with a soft dry cloth. Crochet items should be hand-washed in cool water and laid flat to dry.",
  },
  {
    id: "faq-returns",
    question: "What's your returns and exchange policy?",
    answer:
      "Since most pieces are made to order, we don't accept change-of-mind returns, but if an item arrives damaged or incorrect, contact us within 7 days and we'll replace or refund it.",
  },
  {
    id: "faq-payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept GCash, bank transfer, and major credit/debit cards at checkout. All orders are confirmed by email once payment is received.",
  },
];

export interface InstagramTile {
  id: string;
  caption: string;
  likes: number;
}

export const INSTAGRAM_TILES: InstagramTile[] = [
  { id: "ig1", caption: "New drop incoming 🌸", likes: 214 },
  { id: "ig2", caption: "Packaging peek 📦", likes: 156 },
  { id: "ig3", caption: "Today's pour", likes: 189 },
  { id: "ig4", caption: "Restock Saturday!", likes: 302 },
  { id: "ig5", caption: "Behind the scenes", likes: 141 },
  { id: "ig6", caption: "Custom order finished", likes: 178 },
];

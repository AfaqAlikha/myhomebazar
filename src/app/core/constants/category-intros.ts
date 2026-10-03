/** Unique intro copy for category listing pages (SEO / AdSense content depth). */
export function normalizeCategorySlug(slug: string): string {
  return decodeURIComponent(slug || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const INTROS: Record<string, string[]> = {
  electronics: [
    'Shop electronics from verified sellers across Pakistan on MyHomeBazar. From small appliances and mobile accessories to home entertainment and daily gadgets, our marketplace brings multiple stores into one place so you can compare prices, read descriptions, and choose delivery that suits your city.',
    'Every listing is managed by an independent seller who sets stock, warranty notes, and shipping options. Use filters and search to narrow by brand or price, message the seller if you need compatibility details, and pay with Cash on Delivery or digital wallets where available at checkout.',
    'Orders are protected by our standard marketplace policies: track shipments from your account, and open a claim within 14 days if something arrives damaged or incorrect. For high-value items, check the seller rating and product description carefully before you buy.',
  ],
  fashion: [
    'Discover fashion for men, women, and families from Pakistani sellers on MyHomeBazar. Browse clothing, footwear, and accessories with clear photos and size notes supplied by each store. Our category pages help you explore trends and everyday wear without visiting dozens of separate websites.',
    'Sellers update collections regularly, so new arrivals appear alongside established favourites. Read each product description for fabric, fit, and care instructions, and use in-app chat to confirm measurements or colour before ordering.',
    'We support Cash on Delivery in many areas plus JazzCash, EasyPaisa, and cards when enabled. Free delivery may apply when your order from a seller reaches Rs 5,000 or during promotional periods shown on the site.',
  ],
  'home-and-kitchen': [
    'Home and kitchen products on MyHomeBazar range from cookware and storage to décor and cleaning essentials. Sellers across Lahore, Karachi, Islamabad, and other cities list items suited for Pakistani homes, with descriptions that explain materials, dimensions, and intended use.',
    'Whether you are setting up a new apartment or replacing everyday tools, compare offers from multiple stores in one session. Product pages show seller policies, estimated delivery, and any free-shipping thresholds so you can plan a single checkout or split orders by seller.',
    'MyHomeBazar focuses on trust: verified seller accounts, order tracking, and a claims process if items arrive not as described. Save favourites to your wishlist while signed in, and return to complete purchase when you are ready.',
  ],
  'home-kitchen': [
    'Home and kitchen products on MyHomeBazar range from cookware and storage to décor and cleaning essentials. Sellers across Lahore, Karachi, Islamabad, and other cities list items suited for Pakistani homes, with descriptions that explain materials, dimensions, and intended use.',
    'Whether you are setting up a new apartment or replacing everyday tools, compare offers from multiple stores in one session. Product pages show seller policies, estimated delivery, and any free-shipping thresholds so you can plan a single checkout or split orders by seller.',
    'MyHomeBazar focuses on trust: verified seller accounts, order tracking, and a claims process if items arrive not as described. Save favourites to your wishlist while signed in, and return to complete purchase when you are ready.',
  ],
  'home-decor': [
    'Refresh your living space with home décor from independent sellers on MyHomeBazar. Find lighting accents, wall art, textiles, and seasonal pieces selected for Pakistani tastes and climates. Each seller maintains their own catalogue with photos and written details you can review before adding to cart.',
    'Decor items vary in size and fragility, so read packaging and delivery notes on the product page. Message the seller for custom colour options or bulk orders for events. Combined orders from the same seller may qualify for free delivery when totals reach Rs 5,000.',
    'We encourage descriptive listings so you know exactly what will arrive. After delivery, share honest feedback and use My Claims if anything is missing or broken in transit within the 14-day window stated in our Terms.',
  ],
  kids: [
    'Shop kids products from trusted sellers on MyHomeBazar, including toys, clothing, school essentials, and nursery items. Parents can compare options from multiple stores, filter by price, and read seller-provided safety or age guidance in each description.',
    'Because children products vary widely in quality and suitability, we recommend checking dimensions, materials, and recommended age on every listing. Chat with the seller for stock updates or gift wrapping when available.',
    'Checkout supports COD and online payment methods where configured. Track orders from your account and contact support or open a claim if an item does not match the description or arrives damaged.',
  ],
};

const DEFAULT_INTRO: string[] = [
  'Browse products in this category from verified sellers on MyHomeBazar, Pakistan marketplace for home, lifestyle, and everyday shopping. Each item is listed by an independent store with its own price, stock, and delivery options.',
  'Use sort and search tools to find what you need, read full descriptions on product pages, and message sellers with questions before you buy. Signed-in customers can track orders, save wishlists, and submit claims within 14 days if there is an issue after delivery.',
];

export function getCategoryIntroParagraphs(slug: string, displayName?: string): string[] {
  const key = normalizeCategorySlug(slug);
  if (INTROS[key]?.length) return INTROS[key];
  const nameKey = normalizeCategorySlug(displayName || '');
  if (nameKey && INTROS[nameKey]?.length) return INTROS[nameKey];
  if (displayName) {
    return [
      `Explore ${displayName} from multiple sellers on MyHomeBazar. Compare prices, read detailed listings, and choose Cash on Delivery or digital payment at checkout when available in your area.`,
      ...DEFAULT_INTRO.slice(1),
    ];
  }
  return DEFAULT_INTRO;
}

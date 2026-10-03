import { GuideArticle } from '../guides.model';

export const howSellersJoin: GuideArticle = {
  slug: 'how-sellers-join-and-list-products',
  title: 'How Sellers Join and List Products on MyHomeBazar',
  excerpt:
    'A clear overview of seller registration on admin.myhomebazar.com, listing products, orders, and promotions.',
  author: 'MyHomeBazar Editorial',
  published: '2026-10-02',
  sections: [
    {
      heading: 'Who can sell',
      paragraphs: [
        'MyHomeBazar welcomes independent sellers and small businesses in Pakistan who offer home, lifestyle, electronics, fashion, and related goods. Sellers operate through the admin portal at admin.myhomebazar.com, separate from the buyer website.',
        'Each seller account is reviewed before full access. Buyers who only need to shop should stay on myhomebazar.com; admin social login is for authorized seller and staff roles.',
      ],
    },
    {
      heading: 'Registration steps',
      paragraphs: [
        'Click Become a Seller on the buyer site to open the registration page on the admin portal. Complete business and contact details, verify email if required, and wait for approval notification.',
        'After approval, sign in to the seller dashboard to upload logos, manage profile information, and configure shipping or payout settings where available.',
      ],
    },
    {
      heading: 'Creating product listings',
      paragraphs: [
        'Use the product upload tools to add titles, categories, prices, stock, and descriptions. Write original descriptions with measurements, materials, and what is included in the box. Clear photos reduce returns and build buyer trust.',
        'Select the correct category and attributes so products appear in the right shop filters. Update stock when items sell out to avoid cancellations.',
      ],
    },
    {
      heading: 'Orders and fulfillment',
      paragraphs: [
        'New orders appear in the seller panel with buyer delivery details needed to ship. Book couriers your store uses—TCS, Leopards, PostEx, or others—and add tracking when available so buyers can follow progress.',
        'Respond to in-app messages promptly. COD orders require reliable handoff to couriers; prepaid orders should ship quickly after payment confirmation.',
      ],
    },
    {
      heading: 'Promotions and visibility',
      paragraphs: [
        'Sellers may purchase promotion plans to highlight products on the marketplace. Plans have defined duration and limits shown in the admin area. Promotions expire automatically; follow policy to avoid removal without refund.',
        'Maintain good service to earn repeat customers. Claims or repeated cancellations can affect account standing under marketplace rules.',
      ],
    },
    {
      heading: 'Getting help as a seller',
      paragraphs: [
        'Technical or payout questions go through admin support channels configured in the portal. Keep tax and payout records as required by Pakistani law for your business type.',
        'Buyers discover your store through search, categories, and promotions—quality listings are the best long-term marketing on MyHomeBazar.',
      ],
    },
  ],
};

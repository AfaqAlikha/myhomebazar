import { GuideArticle } from './guides.model';
import { safeOnlineShoppingPakistan } from './content/safe-online-shopping-pakistan';
import { howMyhomebazarWorksBuyers } from './content/how-myhomebazar-works-buyers';
import { howSellersJoin } from './content/how-sellers-join';
import { codVsDigitalPayments } from './content/cod-vs-digital-payments';
import { choosingHomeKitchenProducts } from './content/choosing-home-kitchen-products';

export const GUIDE_ARTICLES: GuideArticle[] = [
  safeOnlineShoppingPakistan,
  howMyhomebazarWorksBuyers,
  howSellersJoin,
  codVsDigitalPayments,
  choosingHomeKitchenProducts,
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.slug === slug);
}

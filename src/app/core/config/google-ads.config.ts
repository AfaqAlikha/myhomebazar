/**
 * Google AdSense configuration for MyHomeBazar storefront.
 *
 * 1. AdSense → Ads → By ad unit → Display ads → create a responsive unit
 * 2. Copy data-ad-slot into env.googleAdsSlotHorizontal (or slots.horizontal below)
 * 3. Enable Auto ads in AdSense dashboard for extra placements
 */
import { env } from '../../../environments/env';

export const GOOGLE_ADS = {
  enabled: true,
  publisherId: env.googleAdsPublisherId || 'ca-pub-1353355245412217',
  slots: {
    horizontal: env.googleAdsSlotHorizontal || '',
    home: '',
    product: '',
    shop: '',
    orderHistory: '',
    claims: '',
  },
} as const;

export type GoogleAdPlacement = keyof typeof GOOGLE_ADS.slots;

export const resolveAdSlot = (placement: GoogleAdPlacement): string => {
  const { slots } = GOOGLE_ADS;
  return slots[placement]?.trim() || slots.horizontal?.trim() || '';
};

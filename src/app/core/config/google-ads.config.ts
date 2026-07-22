/**
 * Google AdSense — horizontal + vertical units for MyHomeBazar storefront.
 */
import { env } from '../../../environments/env';

export const GOOGLE_ADS = {
  enabled: true,
  publisherId: env.googleAdsPublisherId || 'ca-pub-1353355245412217',
  slots: {
    /** myhomebazar_horizontal_ads */
    horizontal: env.googleAdsSlotHorizontal || '',
    /** myhomebazar_verical_ads */
    vertical: env.googleAdsSlotVertical || '',
  },
} as const;

export type GoogleAdVariant = keyof typeof GOOGLE_ADS.slots;

export const resolveAdSlot = (variant: GoogleAdVariant): string =>
  GOOGLE_ADS.slots[variant]?.trim() || '';

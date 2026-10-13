/**
 * Google AdSense — horizontal + vertical units for MyHomeBazar storefront.
 */
import { env } from '../../../environments/env';
import { GOOGLE_ADSENSE } from '../constants/google-adsense.constants';

export const GOOGLE_ADS = {
  enabled: true,
  publisherId: env.googleAdsPublisherId || GOOGLE_ADSENSE.publisherId,
  slots: {
    /** myhomebazar_horizontal */
    horizontal: env.googleAdsSlotHorizontal || GOOGLE_ADSENSE.slotHorizontal,
    /** myhomebazar_vertical */
    vertical: env.googleAdsSlotVertical || GOOGLE_ADSENSE.slotVertical,
  },
} as const;

export type GoogleAdVariant = keyof typeof GOOGLE_ADS.slots;

export const resolveAdSlot = (variant: GoogleAdVariant): string =>
  GOOGLE_ADS.slots[variant]?.trim() || '';

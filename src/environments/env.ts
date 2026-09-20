// export const env = {
//   BASE_URL: 'http://localhost:5000/api',
//   WEBSOCET_URL: 'http://localhost:5000',
//   SELLER_PORTAL_URL: 'http://localhost:3000',
// };

export const env = {
  production: true,
  BASE_URL: 'https://api.myhomebazar.com/api',
  WEBSOCET_URL: 'https://api.myhomebazar.com',
  SELLER_PORTAL_URL: 'https://admin.myhomebazar.com',
  googleAdsPublisherId: 'ca-pub-4666633726308706',
  /** myhomebazar_horizontal */
  googleAdsSlotHorizontal: '1622181734',
  /** myhomebazar_vertical */
  googleAdsSlotVertical: '1997586256',
  SOCKET_TRANSPORTS: ['polling', 'websocket'] as ('polling' | 'websocket')[],
};

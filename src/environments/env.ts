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
  googleAdsPublisherId: 'ca-pub-1353355245412217',
  /** myhomebazar_horizontal_ads */
  googleAdsSlotHorizontal: '3787726405',
  // Use polling-only on live until nginx + single PM2 worker are confirmed.
  SOCKET_TRANSPORTS: ['polling'] as ('polling' | 'websocket')[],
};

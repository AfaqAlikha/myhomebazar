export type ChatTargetRole = 'seller' | 'admin' | 'superadmin' | 'user' | string;

export interface ChatTargetUser {
  _id?: string;
  id?: string;
  role?: ChatTargetRole;
}

export function getChatTargetId(user: ChatTargetUser | null | undefined): string {
  if (!user) return '';
  return String(user._id || user.id || '');
}

/** Logged-in users may chat with sellers and admins; never with superadmin or self. */
export function canMessageUser(
  owner: ChatTargetUser | null | undefined,
  viewerId?: string | null,
): boolean {
  const ownerId = getChatTargetId(owner);
  if (!ownerId) return false;
  if (viewerId && String(viewerId) === ownerId) return false;

  const role = String(owner?.role || '').toLowerCase();
  if (role === 'superadmin') return false;
  return role === 'seller' || role === 'admin';
}

export function getProfileMessageLabel(role?: string): string {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Message support';
  return 'Message seller';
}

export function getProductChatLabel(role?: string): string {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Chat about this product';
  return 'Chat about this product';
}

export function getStoreEyebrowLabel(role?: string): string {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Official store';
  return 'Verified seller store';
}

export function getSellerListBadge(role?: string): string | null {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'Official store';
  return null;
}

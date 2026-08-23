export type UserEventAction =
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_wishlist'
  | 'remove_from_wishlist'
  | 'shop_visit'
  | 'purchase';

export interface UserEvent {
  clerkId: string;
  action: UserEventAction;
  productId?: string;
  shopId?: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  timestamp: string;
}

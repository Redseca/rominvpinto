
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  purchasedIds: string[];
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
}

export enum ViewMode {
  GALLERY = 'GALLERY',
  MY_CONTENT = 'MY_CONTENT',
  UPLOAD = 'UPLOAD',
  AUTH = 'AUTH'
}

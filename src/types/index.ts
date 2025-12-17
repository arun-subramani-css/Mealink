export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Item {
  id: string;
  title: string;
  category: 'food' | 'clothes' | 'products';
  description: string;
  quantity: number;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
  };
  providerId: string;
  providerName: string;
  createdAt: Date;
  status: 'available' | 'pending' | 'completed';
  receiverId?: string;
  isVeg?: boolean;
  expiryDate?: Date;
  condition?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  itemId: string;
  type: 'donated' | 'received';
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: Date;
}

export type UserRole = 'provider' | 'receiver';
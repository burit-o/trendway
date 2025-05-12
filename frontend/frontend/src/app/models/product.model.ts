import { Category } from './category.model';

// Satıcı bilgilerini tutacak basit bir arayüz
export interface Seller {
  id: number;
  fullName: string;
  // Gerekirse başka satıcı bilgileri eklenebilir
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrls: string[];
  category: Category; // Kategori bilgisi zaten var
  active: boolean;
  averageRating?: number; // Opsiyonel olabilir
  reviewCount?: number;   // Opsiyonel olabilir
  deletedByAdmin: boolean;
  seller: Seller; // Yeni eklenen satıcı bilgisi
}

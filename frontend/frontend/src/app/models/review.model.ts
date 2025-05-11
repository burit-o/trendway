export interface Review {
    id?: number;
    productId: number;
    userId: number;
    userName?: string; // Yorumu yapanın adı (backendden gelirse)
    rating: number; // 1-5 arası puan
    comment: string;
    reviewDate: string; // veya Date
}

export interface ReviewRequest { // Yorum ekleme isteği için model
    productId: number;
    rating: number;
    comment: string;
}

 
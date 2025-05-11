export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrls: string[];
    category: {
        id: number;
        name: string;
    };
    averageRating: number;
    reviewCount: number;
    active: boolean;
    createdAt: string;
}

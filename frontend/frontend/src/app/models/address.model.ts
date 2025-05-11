export interface Address {
    id?: number;          // Backend tarafından atanır, opsiyonel
    userId: number;       // Kullanıcı ID'si
    street: string;
    city: string;
    state?: string;        // Eyalet/İl, opsiyonel - Formdan kalkacak ama modelde kalabilir
    zipCode: string;
    country: string;
    // addressType?: 'SHIPPING' | 'BILLING' | string; // KALDIRILDI
    // contactName?: string;  // KALDIRILDI
    contactPhone?: string; // İletişim telefonu, opsiyonel
} 
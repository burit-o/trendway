package com.ecommerce.backend.model;

public enum OrderItemStatus {
    PREPARING,
    SHIPPED,        // Gönderildi
    DELIVERED,      // Teslim edildi
    EXCHANGED,      // Değiştirildi
    CANCELLED,      // Müşteri tarafından iptal edildi (varsayım)
    CANCELLED_BY_SELLER // Satıcı tarafından iptal edildi (yeni)
}

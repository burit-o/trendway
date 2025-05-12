package com.ecommerce.backend.model;

public enum OrderStatus {
    PREPARING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURNED,
    EXCHANGE_REQUESTED,
    REFUNDED        // İade edildi (tüm sipariş iade edildi)
}

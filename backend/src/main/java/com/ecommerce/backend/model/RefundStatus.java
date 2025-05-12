package com.ecommerce.backend.model;

public enum RefundStatus {
    PENDING_APPROVAL, // İade talebi beklemede
    APPROVED,         // İade talebi onaylandı
    REJECTED,         // İade talebi reddedildi
    COMPLETED         // İade işlemi tamamlandı (para iadesi yapıldı)
} 
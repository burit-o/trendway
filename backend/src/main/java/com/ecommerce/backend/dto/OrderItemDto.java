package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.OrderItem;
import com.ecommerce.backend.model.OrderItemStatus;
import com.ecommerce.backend.model.RefundStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    private Double priceAtPurchase;
    private String status;
    
    // İade ile ilgili alanlar
    private RefundStatus refundStatus;
    private String refundReason;
    private LocalDateTime refundRequestedAt;
    private LocalDateTime refundProcessedAt;

    public static OrderItemDto fromEntity(OrderItem item) {
        String imageUrl = null;
        if (item.getProduct() != null && item.getProduct().getImageUrls() != null && !item.getProduct().getImageUrls().isEmpty()) {
            imageUrl = item.getProduct().getImageUrls().get(0);
        }

        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .imageUrl(imageUrl)
                .quantity(item.getQuantity())
                .priceAtPurchase(item.getPriceAtPurchase())
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .refundStatus(item.getRefundStatus())
                .refundReason(item.getRefundReason())
                .refundRequestedAt(item.getRefundRequestedAt())
                .refundProcessedAt(item.getRefundProcessedAt())
                .build();
    }
} 
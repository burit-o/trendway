package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.OrderItem;
import com.ecommerce.backend.model.OrderItemStatus;
import lombok.Builder;
import lombok.Data;

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
                .build();
    }
} 
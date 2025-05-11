package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class OrderDto {
    private Long id;
    private Long customerId;
    private String customerFullName; // Eklenebilir
    private List<OrderItemDto> items;
    private AddressDto address; // AddressDto da oluşturulmalı veya import edilmeli
    private LocalDateTime createdAt;
    private OrderStatus status;
    private Double totalPrice;
    private String paymentIntentId;

    public static OrderDto fromEntity(Order order) {
        if (order == null) return null;
        return OrderDto.builder()
                .id(order.getId())
                .customerId(order.getCustomer().getId())
                .customerFullName(order.getCustomer().getFullName()) // Örnek
                .items(order.getItems().stream().map(OrderItemDto::fromEntity).collect(Collectors.toList()))
                .address(AddressDto.fromEntity(order.getAddress())) // AddressDto.fromEntity çağrısı
                .createdAt(order.getCreatedAt())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .paymentIntentId(order.getPaymentIntentId())
                .build();
    }
} 
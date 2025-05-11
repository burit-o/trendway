package com.ecommerce.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // ✅ fetch tipi netleştirildi
    private Product product;

    private int quantity;

    @JsonProperty("price")
    private double priceAtPurchase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderItemStatus status = OrderItemStatus.PREPARING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private Order order;

    @JsonProperty("productName")
    public String getProductName() {
        return (this.product != null) ? this.product.getName() : null;
    }

    @JsonProperty("imageUrl")
    public String getImageUrl() {
        if (this.product != null && this.product.getImageUrls() != null && !this.product.getImageUrls().isEmpty()) {
            return this.product.getImageUrls().get(0);
        }
        return null; // Veya "assets/placeholder.jpg" gibi varsayılan bir yol
    }
}

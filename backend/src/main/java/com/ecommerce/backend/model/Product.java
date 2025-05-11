package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(length = 1000)
    private String description;

    private BigDecimal price;

    private int stock;

    @ElementCollection
    private List<String> imageUrls = new ArrayList<>(); // image URL'leri

    @ManyToOne
    @JsonIgnoreProperties("products") // Sadece products alanı hariç tutulsun
    private Category category;

    @ManyToOne
    @JsonIgnoreProperties({ "products", "addresses", "orders" })
    @JoinColumn(name = "seller_id")
    private User seller;
    private boolean active = true;

    // Yeni eklenen alanlar (frontend'in beklediği)
    @Transient // Veritabanında sütun olarak oluşturulmayacak, servis tarafından hesaplanacak
    private Double averageRating = 0.0;

    @Transient // Veritabanında sütun olarak oluşturulmayacak, servis tarafından hesaplanacak
    private Integer reviewCount = 0;

    private boolean deletedByAdmin = false;
}

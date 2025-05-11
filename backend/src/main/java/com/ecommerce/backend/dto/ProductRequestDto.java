package com.ecommerce.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequestDto {

    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 3, max = 255, message = "Product name must be between 3 and 255 characters")
    private String name;

    @NotBlank(message = "Description cannot be blank")
    @Size(max = 1000, message = "Description can be at most 1000 characters")
    private String description;

    @NotNull(message = "Price cannot be null")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Stock quantity cannot be null")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stock;

    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    // Resim URL'leri için özel validasyon gerekebilir (örn: geçerli URL formatı)
    private List<String> imageUrls;
    
    // active durumu DTO içinde olmalı mı? Genelde yeni ürünler varsayılan olarak active olur.
    // Şimdilik eklemiyorum, gerekirse eklenebilir.
    // private Boolean active;
} 
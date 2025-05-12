package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.OrderItem;
import com.ecommerce.backend.model.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Buraya özel sorgular ekleyebilirsiniz
    
    // Satıcının ürünleri arasında iade talebi olan ürünleri bul
    @Query("SELECT oi FROM OrderItem oi WHERE oi.product.seller.id = :sellerId AND oi.refundStatus = :status")
    List<OrderItem> findByProductSellerIdAndRefundStatus(@Param("sellerId") Long sellerId, @Param("status") RefundStatus status);
}

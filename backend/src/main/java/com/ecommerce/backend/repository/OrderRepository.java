package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product LEFT JOIN FETCH o.address WHERE o.customer = :customer ORDER BY o.createdAt DESC")
    List<Order> findByCustomerWithDetails(@Param("customer") User customer);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items oi WHERE o.customer = :customer AND oi.product.id = :productId AND o.status = :status")
    boolean existsByCustomerAndProductIdAndStatus(
            @Param("customer") User customer,
            @Param("productId") Long productId,
            @Param("status") OrderStatus status
    );
}

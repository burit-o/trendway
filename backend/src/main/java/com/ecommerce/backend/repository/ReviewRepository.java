package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);

    boolean existsByCustomerAndProduct(User customer, Product product);
}

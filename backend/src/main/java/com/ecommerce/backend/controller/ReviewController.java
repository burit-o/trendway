package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ReviewRequest;
import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Review> addReview(
            @Valid @RequestBody ReviewRequest reviewRequest,
            Principal principal
    ) {
        String userEmail = principal.getName();
        return ResponseEntity.ok(
                reviewService.addReview(reviewRequest, userEmail)
        );
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId));
    }

    @PutMapping("/reply/{reviewId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Review> replyToReview(
            @PathVariable Long reviewId,
            @RequestParam Long sellerId,
            @RequestParam String reply
    ) {
        return ResponseEntity.ok(
                reviewService.replyToReview(reviewId, sellerId, reply)
        );
    }

    @DeleteMapping("/delete/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok().build();
    }
}

package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProductController {

    private final ProductService productService;

    @GetMapping("/public/active")
    public ResponseEntity<List<Product>> getPublicActiveProducts() {
        return ResponseEntity.ok(productService.getActiveAndNotDeletedProducts());
    }

    @GetMapping("/public/category/{id}")
    public ResponseEntity<List<Product>> getPublicByCategory(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductsByCategory(id));
    }

    @GetMapping("/active-not-deleted")
    public ResponseEntity<List<Product>> getActiveAndNotDeletedProducts() {
        List<Product> products = productService.getActiveAndNotDeletedProducts();
        return ResponseEntity.ok(products);
    }

    @PostMapping("/add/{sellerId}/{categoryId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Product> addProduct(
            @RequestBody Product product,
            @PathVariable Long sellerId,
            @PathVariable Long categoryId
    ) {
        return ResponseEntity.ok(productService.addProduct(product, sellerId, categoryId));
    }

    @PutMapping("/deactivate/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProductByAdmin(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/seller/{sellerId}")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<List<Product>> getProductsBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(productService.getProductsBySeller(sellerId));
    }

    @DeleteMapping("/delete/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<String> deleteProductBySeller(
            @PathVariable Long productId,
            Principal principal
    ) {
        productService.deleteProductBySeller(productId, principal.getName());
        return ResponseEntity.ok("Ürün başarıyla silindi.");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        try {
            Product product = productService.findProductById(id);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<Product> updateProductDetails(
            @PathVariable Long productId,
            @RequestBody Product productDetails,
            Principal principal
    ) {
        Product updatedProduct = productService.updateProductDetails(productId, productDetails, principal.getName());
        return ResponseEntity.ok(updatedProduct);
    }

    @GetMapping("/not-deleted")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Product>> getAllNotDeletedProducts() {
        List<Product> products = productService.getAllNotDeletedProducts();
        return ResponseEntity.ok(products);
    }
}

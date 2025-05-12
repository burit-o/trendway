package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.model.Role;
import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public List<Product> getAllActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    // Aktiff ve admin tarafından silinmemiş ürünleri döndürmek
    public List<Product> getActiveAndNotDeletedProducts() {
        List<Product> products = productRepository.findByActiveTrueAndDeletedByAdminFalse();
        products.forEach(this::calculateAndSetProductRating);
        return products;
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public Product addProduct(Product product, Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        if (seller.getRole() != Role.SELLER) {
            throw new RuntimeException("Only sellers can add products");
        }

        if (product.getCategory() == null || product.getCategory().getId() == null) {
            throw new RuntimeException("Category ID must be provided within the product object");
        }
        Category category = categoryRepository.findById(product.getCategory().getId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + product.getCategory().getId()));

        product.setSeller(seller);
        product.setCategory(category);
        product.setActive(true);
        product.setDeletedByAdmin(false);
        product.setId(null);

        return productRepository.save(product);
    }

    public void deactivateProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setActive(false);
        productRepository.save(product);
    }

    public void deleteProductByAdmin(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Ürünün "deletedByAdmin" kısmını true yapıyoruz
        product.setDeletedByAdmin(true);
        productRepository.save(product);
    }

    public List<Product> getProductsBySeller(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        return productRepository.findBySeller(seller);
    }

    public void deleteProductBySeller(Long productId, String sellerEmail) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new RuntimeException("Bu ürünü silmeye yetkiniz yok.");
        }

        productRepository.delete(product);
    }

    // Yeni eklenecek metod
    public Product findProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
        calculateAndSetProductRating(product);
        return product;
    }

    // Helper metod
    private void calculateAndSetProductRating(Product product) {
        List<Review> reviews = reviewRepository.findByProduct(product);
        if (reviews == null || reviews.isEmpty()) {
            product.setAverageRating(0.0);
            product.setReviewCount(0);
        } else {
            double sum = reviews.stream().mapToInt(Review::getRating).sum();
            product.setAverageRating(sum / reviews.size());
            product.setReviewCount(reviews.size());
        }
    }

    public Product updateProductDetails(Long productId, Product productDetails, String userEmail) {
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        // ADMIN her ürünü güncelleyebilir, SELLER sadece kendine ait ürünleri güncelleyebilir
        if (user.getRole() != Role.ADMIN && !existingProduct.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden: You can only update your own products.");
        }

        // Güncellenebilir alanları ayarla
        if (productDetails.getName() != null) {
            existingProduct.setName(productDetails.getName());
        }
        if (productDetails.getDescription() != null) {
            existingProduct.setDescription(productDetails.getDescription());
        }
        if (productDetails.getPrice() != null) {
            existingProduct.setPrice(productDetails.getPrice());
        }
        if (productDetails.getImageUrls() != null && !productDetails.getImageUrls().isEmpty()) {
            existingProduct.setImageUrls(productDetails.getImageUrls()); 
        }
        
        // Active durumu için özel kontrol
        existingProduct.setActive(productDetails.isActive());
        
        // Stock durumu güncellemesi
        if (productDetails.getStock() > 0) {
            existingProduct.setStock(productDetails.getStock());
        }

        return productRepository.save(existingProduct);
    }

    // Silinmemiş tüm ürünleri getirme metodu (aktif ve inaktif dahil)
    public List<Product> getAllNotDeletedProducts() {
        List<Product> products = productRepository.findByDeletedByAdminFalse();
        products.forEach(this::calculateAndSetProductRating);
        return products;
    }

}

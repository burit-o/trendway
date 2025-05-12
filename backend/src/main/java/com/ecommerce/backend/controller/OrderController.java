package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderItem;
import com.ecommerce.backend.model.OrderItemStatus;
import com.ecommerce.backend.model.OrderStatus;
import com.ecommerce.backend.model.RefundStatus;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.service.OrderService;
import com.ecommerce.backend.service.StripeService;
import com.ecommerce.backend.dto.OrderDto;
import com.ecommerce.backend.dto.OrderItemDto;
import com.ecommerce.backend.dto.RefundRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
// @RequiredArgsConstructor // Manuel constructor eklendiği için kaldırıldı veya yorumlandı
public class OrderController {
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final StripeService stripeService;
    private final ObjectMapper objectMapper; // ObjectMapper eklendi

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    // ObjectMapper'ı enjekte etmek için constructor güncellendi
    public OrderController(UserRepository userRepository, OrderService orderService, StripeService stripeService, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.stripeService = stripeService;
        this.objectMapper = objectMapper;
    }

    // 🛒 Sepetten sipariş oluştur
    @PostMapping("/from-cart")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> placeOrderFromCart(@RequestParam Long userId, Principal principal) {
        String email = principal.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Kendi siparişi mi kontrolü
        if (!user.getId().equals(userId)) {
            logger.warn("Forbidden attempt to place order for userId {} by user {}", userId, email);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to place this order.");
        }

        try {
            Order order = orderService.placeOrderFromCart(userId);
            logger.info("Order object before attempting to serialize: ID={}, Status={}", order.getId(), order.getStatus());

            // Manuel JSON'a çevirme denemesi
            try {
                String orderJson = objectMapper.writeValueAsString(order);
                logger.info("Successfully serialized Order to JSON: {}", orderJson);
            } catch (Exception serializationException) {
                logger.error("!!! Jackson serialization FAILED for Order ID {}: {}", order.getId(), serializationException.getMessage(), serializationException);
            }

            return ResponseEntity.ok(order); // Bu satır hala HttpMessageNotWritableException verebilir
        } catch (Exception e) {
            logger.error("Order creation failed in controller for userId {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order creation failed: " + e.getMessage());
        }
    }

    // 🔃 Sipariş durumunu güncelle (Sadece SELLER -> PREPARING → SHIPPED →
    // DELIVERED)
    @PutMapping("/update-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<String> updateStatus(
            @RequestParam Long orderId,
            @RequestParam Long sellerId,
            @RequestParam OrderStatus status) {
        orderService.updateOrderStatus(orderId, sellerId, status);
        return ResponseEntity.ok("Durum güncellendi: " + status.name());
    }

    @PutMapping("/update-item-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<String> updateOrderItemStatus(
            @RequestParam Long orderItemId,
            @RequestParam OrderItemStatus status,
            Principal principal) {
        try {
            // Admin veya Satıcı kontrolü yapılacak
            String userEmail = principal.getName();
            orderService.updateOrderItemStatus(orderItemId, status, userEmail);
            return ResponseEntity.ok("Order item status updated to " + status.name());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // ❌ Siparişi Admin iptal eder
    @PutMapping("/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cancelOrderByAdmin(@RequestParam Long orderId) {
        orderService.cancelOrderByAdmin(orderId);
        return ResponseEntity.ok("Sipariş iptal edildi");
    }

    // 💸 Admin ödeme iadesi yapar
    @PutMapping("/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> refundOrder(@RequestParam Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);

            if (order.getPaymentIntentId() == null || order.getPaymentIntentId().isBlank()) {
                return ResponseEntity.badRequest().body("Bu sipariş için ödeme bilgisi bulunamadı.");
            }

            stripeService.refundPayment(order.getPaymentIntentId());
            order.setStatus(OrderStatus.CANCELLED);
            orderService.saveOrder(order);

            return ResponseEntity.ok("İade işlemi başarıyla gerçekleşti.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("İade işlemi sırasında hata: " + e.getMessage());
        }
    }

    @GetMapping("/by-customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getOrders(@RequestParam Long userId, Principal principal) {
        try {
            String email = principal.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!currentUser.getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You are not allowed to view orders of another user.");
            }

            List<Order> orders = orderService.getOrdersByCustomer(userId);
            // Convert List<Order> to List<OrderDto>
            List<OrderDto> orderDtos = orders.stream()
                                             .map(OrderDto::fromEntity)
                                             .collect(Collectors.toList());
            return ResponseEntity.ok(orderDtos); // Return DTO list

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to fetch orders: " + e.getMessage());
        }
    }

    // Sipariş detaylarını getir
    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'SELLER')")
    public ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    // Kullanıcı değişim talebi oluşturur
    @PutMapping("/request-exchange")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> requestExchange(
            @RequestParam Long orderId,
            @RequestParam Long userId) {
        orderService.requestExchange(orderId, userId);
        return ResponseEntity.ok("Değişim talebiniz alınmıştır.");
    }

    // Satıcı değişimi onaylar
    @PutMapping("/approve-exchange")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<String> approveExchangeRequest(
            @RequestParam Long orderId,
            @RequestParam Long sellerId) {
        orderService.approveExchangeRequest(orderId, sellerId);
        return ResponseEntity.ok("Değişim onaylandı, sipariş tekrar hazırlanıyor.");
    }

    @PutMapping("/item/{orderItemId}/cancel-by-seller")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> cancelOrderItemBySeller(
            @PathVariable Long orderItemId,
            Principal principal) {
        try {
            String sellerEmail = principal.getName();
            com.ecommerce.backend.model.OrderItem updatedOrderItem = orderService.cancelOrderItemBySeller(orderItemId, sellerEmail);
            return ResponseEntity.ok(updatedOrderItem);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); // Örn: Zaten iptal edilmiş veya teslim edilmiş
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage()); // Yetkisiz işlem
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage()); // Örn: Ürün veya satıcı bulunamadı
        }
    }

    @PutMapping("/item/{orderItemId}/cancel-by-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelOrderItemByAdmin(
            @PathVariable Long orderItemId,
            Principal principal) {
        try {
            String adminEmail = principal.getName();
            com.ecommerce.backend.model.OrderItem updatedOrderItem = orderService.cancelOrderItemByAdmin(orderItemId, adminEmail);
            return ResponseEntity.ok(updatedOrderItem);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); 
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/check-purchase")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Boolean> checkPurchase(
            @RequestParam Long productId,
            Principal principal) {
        try {
            String userEmail = principal.getName();
            boolean hasPurchased = orderService.hasUserPurchasedProduct(userEmail, productId);
            return ResponseEntity.ok(hasPurchased);
        } catch (Exception e) {
            // Kullanıcı bulunamazsa veya başka bir hata oluşursa false dönebiliriz
            // veya daha spesifik bir hata yönetimi yapılabilir.
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    @GetMapping("/seller") // Mevcut sellerId path variable yerine Principal kullanacağız
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> getOrdersBySeller(Principal principal) {
        try {
            User seller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Seller not found with email: " + principal.getName()));

            if (seller.getId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Seller ID is missing.");
            }

            List<Order> orders = orderService.getOrdersBySeller(seller.getId());
            // Order listesini OrderDto listesine dönüştür
            List<OrderDto> orderDtos = orders.stream()
                                             .map(OrderDto::fromEntity)
                                             .collect(Collectors.toList());
            return ResponseEntity.ok(orderDtos); // DTO listesini döndür
        } catch (Exception e) {
            logger.error("Failed to fetch orders for seller {}: {}", principal.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch orders: " + e.getMessage());
        }
    }

    // Müşteri iade talebi oluşturur
    @PostMapping("/{orderId}/request-refund")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'USER')")
    public ResponseEntity<?> requestRefund(
            @PathVariable Long orderId,
            @RequestBody RefundRequestDto refundRequest,
            Principal principal) {
        try {
            String userEmail = principal.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            OrderItem orderItem = orderService.requestRefund(orderId, refundRequest.getOrderItemId(), 
                                                           refundRequest.getReason(), user.getId());
            
            return ResponseEntity.ok(OrderItemDto.fromEntity(orderItem));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Refund request failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("İade talebi işleme alınamadı: " + e.getMessage());
        }
    }
    
    // Satıcı bekleyen iade taleplerini listeler
    @GetMapping("/refund-requests/by-seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> getRefundRequestsBySeller(Principal principal) {
        try {
            User seller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Seller not found"));
            
            List<OrderItem> refundRequests = orderService.getRefundRequestsBySeller(seller.getId());
            List<OrderItemDto> refundRequestDtos = refundRequests.stream()
                    .map(OrderItemDto::fromEntity)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(refundRequestDtos);
        } catch (Exception e) {
            logger.error("Failed to fetch refund requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("İade talepleri alınamadı: " + e.getMessage());
        }
    }
    
    // Satıcı iade talebini onaylar
    @PutMapping("/refund-requests/{orderItemId}/approve")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> approveRefundRequest(
            @PathVariable Long orderItemId,
            Principal principal) {
        try {
            User seller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Seller not found"));
            
            OrderItem orderItem = orderService.approveRefundRequest(orderItemId, seller.getId());
            return ResponseEntity.ok(OrderItemDto.fromEntity(orderItem));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to approve refund request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("İade talebi onaylanamadı: " + e.getMessage());
        }
    }
    
    // Satıcı iade talebini reddeder
    @PutMapping("/refund-requests/{orderItemId}/reject")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> rejectRefundRequest(
            @PathVariable Long orderItemId,
            @RequestParam String rejectionReason,
            Principal principal) {
        try {
            User seller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Seller not found"));
            
            OrderItem orderItem = orderService.rejectRefundRequest(orderItemId, rejectionReason, seller.getId());
            return ResponseEntity.ok(OrderItemDto.fromEntity(orderItem));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to reject refund request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("İade talebi reddedilemedi: " + e.getMessage());
        }
    }

    // Admin: Tüm siparişleri getir
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders() {
        try {
            List<Order> allOrders = orderService.getAllOrders();
            List<OrderDto> orderDtos = allOrders.stream()
                                            .map(OrderDto::fromEntity)
                                            .collect(Collectors.toList());
            return ResponseEntity.ok(orderDtos);
        } catch (Exception e) {
            logger.error("Failed to fetch all orders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch orders: " + e.getMessage());
        }
    }
}
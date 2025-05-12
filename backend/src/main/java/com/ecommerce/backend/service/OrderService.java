package com.ecommerce.backend.service;

import com.ecommerce.backend.exception.MissingAddressException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.CartRepository;
import com.ecommerce.backend.repository.OrderItemRepository;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.stripe.exception.StripeException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final OrderItemRepository orderItemRepository;
    private final StripeService stripeService;

    private void validateUserAddress(User user) {
        if (user.getAddresses().isEmpty()) {
            throw new MissingAddressException("The user does not have an address. Add address before ordering.");
        }
    }

    public Order placeOrder(Long userId, List<Long> productIds, List<Integer> quantities) {
        User customer = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateUserAddress(customer);
        Address latestAddress = customer.getAddresses().get(0);
        List<OrderItem> items = new ArrayList<>();
        double total = 0.0;

        Order order = Order.builder()
                .customer(customer)
                .address(latestAddress)
                .createdAt(LocalDateTime.now())
                .status(OrderStatus.PREPARING)
                .build();

        for (int i = 0; i < productIds.size(); i++) {
            Product product = productRepository.findById(productIds.get(i))
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            int quantity = quantities.get(i);

            if (product.getStock() < quantity) {
                throw new RuntimeException("Insufficient stock: " + product.getName());
            }

            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(quantity)
                    .priceAtPurchase(product.getPrice().doubleValue())
                    .status(OrderItemStatus.PREPARING)
                    .order(order) // ✅ BURADA SET EDİLİYOR
                    .build();

            items.add(item);
            total += quantity * product.getPrice().doubleValue();
        }

        order.setItems(items);
        order.setTotalPrice(total);
        return orderRepository.save(order);
    }

    @Transactional
    public Order placeOrderFromCart(Long userId) {
        User customer = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateUserAddress(customer);

        Cart cart = cartRepository.findByUser(customer)
                .orElseThrow(() -> new RuntimeException("Cart not found or empty"));

        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty. Cannot place order.");
        }

        Address latestAddress = customer.getAddresses().get(0);
        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0.0;

        Order order = Order.builder()
                .customer(customer)
                .address(latestAddress)
                .createdAt(LocalDateTime.now())
                .status(OrderStatus.PREPARING)
                .build();

        for (CartItem cartItem : cart.getItems()) {
            // 🔧 BURASI ÖNEMLİ — product'ı DB'den yeniden çekiyoruz
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock: " + product.getName());
            }

            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .priceAtPurchase(product.getPrice().doubleValue())
                    .status(OrderItemStatus.PREPARING)
                    .order(order)
                    .build();

            orderItems.add(item);
            total += cartItem.getQuantity() * product.getPrice().doubleValue();
        }

        order.setItems(orderItems);
        order.setTotalPrice(total);

        Order savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        return savedOrder;
    }

    // Helper metod: Bir siparişin tüm kalemlerinin durumlarına göre genel sipariş durumunu günceller
    private void updateOverallOrderStatus(Order order) {
        if (order == null || order.getItems() == null || order.getItems().isEmpty()) {
            return; // İşlem yapılacak item yoksa veya order null ise çık
        }

        // Tüm ürünler iade edilmiş mi kontrol et
        boolean allItemsRefunded = order.getItems().stream()
            .allMatch(item -> item.getStatus() == OrderItemStatus.REFUNDED);
        
        if (allItemsRefunded) {
            order.setStatus(OrderStatus.REFUNDED);
            orderRepository.save(order);
            return;
        }
        
        // Tüm ürünler iptal edilmiş mi kontrol et
        boolean allItemsCancelled = order.getItems().stream()
            .allMatch(item -> item.getStatus() == OrderItemStatus.CANCELLED || 
                               item.getStatus() == OrderItemStatus.CANCELLED_BY_SELLER ||
                               item.getStatus() == OrderItemStatus.CANCELLED_BY_ADMIN);
        
        if (allItemsCancelled) {
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);
            return;
        }

        // Eğer hepsi iptal veya iade değilse, diğer durumları kontrol et
        boolean allDelivered = order.getItems().stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED && 
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_SELLER &&
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_ADMIN &&
                               item.getStatus() != OrderItemStatus.REFUNDED)
                .allMatch(item -> item.getStatus() == OrderItemStatus.DELIVERED);
                
        boolean allShipped = order.getItems().stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED && 
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_SELLER &&
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_ADMIN &&
                               item.getStatus() != OrderItemStatus.REFUNDED)
                .allMatch(item -> item.getStatus() == OrderItemStatus.SHIPPED || item.getStatus() == OrderItemStatus.DELIVERED);

        if (allDelivered) {
            order.setStatus(OrderStatus.DELIVERED);
        } else if (allShipped) {
            order.setStatus(OrderStatus.SHIPPED);
        } else {
            // Eğer en az bir tane bile PREPARING varsa veya farklı aktif statüler varsa PREPARING olabilir.
            // Ya da daha karmaşık bir mantık gerekebilir. Şimdilik PREPARING olarak bırakalım.
            // İptal olmayan ve teslim edilmemiş/gönderilmemiş item varsa PREPARING'dir.
            boolean anyPreparing = order.getItems().stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED && 
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_SELLER &&
                               item.getStatus() != OrderItemStatus.CANCELLED_BY_ADMIN &&
                               item.getStatus() != OrderItemStatus.REFUNDED)
                .anyMatch(item -> item.getStatus() == OrderItemStatus.PREPARING);
                
            if (anyPreparing) {
                order.setStatus(OrderStatus.PREPARING);
            }
            // Eğer hepsi SHIPPED/DELIVERED/CANCELLED değilse ve PREPARING de yoksa, durum karışık olabilir.
            // Bu durumda, siparişin ilk durumuna (genellikle PREPARING) veya daha genel bir duruma (PROCESSING) dönülebilir.
            // Şimdilik, PREPARING yoksa ve hepsi SHIPPED/DELIVERED değilse durum değişmeyebilir veya mevcut mantıkla devam edebilir.
        }
        
        orderRepository.save(order);
    }

    @Transactional
    public void updateOrderItemStatus(Long orderItemId, OrderItemStatus status, String userEmail) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        // Kullanıcı kontrolü
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", userEmail);
                    return new RuntimeException("User not found with email: " + userEmail);
                });

        if (user.getRole() == Role.ADMIN) {
            // Admin tüm durumları değiştirebilir
            logger.info("Admin {} is changing status of order item {} to {}", userEmail, orderItemId, status);
        } 
        else if (user.getRole() == Role.SELLER) {
            // Satıcı sadece kendi ürünlerinin durumunu değiştirebilir
            Product product = orderItem.getProduct();
            
            if (product == null || product.getSeller() == null) {
                logger.error("Product or seller information is missing for order item ID: {}", orderItemId);
                throw new RuntimeException("Product or seller information is missing for the order item.");
            }
            
            if (!product.getSeller().getId().equals(user.getId())) {
                logger.warn("Unauthorized attempt by seller {} to update status for order item {} that belongs to another seller", 
                    userEmail, orderItemId);
                throw new SecurityException("You are not authorized to update the status of this order item as you are not the seller of the product.");
            }
            
            // Satıcının yapabileceği durum değişikliklerini kontrol et
            if (status == OrderItemStatus.CANCELLED_BY_ADMIN) {
                logger.warn("Seller {} attempted to set admin-only status {} for order item {}", userEmail, status, orderItemId);
                throw new SecurityException("Sellers cannot set this status: " + status);
            }
            
            logger.info("Seller {} is changing status of order item {} to {}", userEmail, orderItemId, status);
        }
        else {
            // Diğer roller durum değiştiremez
            logger.warn("Unauthorized user with role {} attempted to update order item status", user.getRole());
            throw new SecurityException("You are not authorized to update order item status. Required role: ADMIN or SELLER");
        }

        // Mevcut durumda yapılamayacak değişiklikleri kontrol et
        if (orderItem.getStatus() == OrderItemStatus.DELIVERED ||
            orderItem.getStatus() == OrderItemStatus.CANCELLED ||
            orderItem.getStatus() == OrderItemStatus.CANCELLED_BY_SELLER ||
            orderItem.getStatus() == OrderItemStatus.CANCELLED_BY_ADMIN ||
            orderItem.getStatus() == OrderItemStatus.REFUNDED) {
            
            logger.warn("Cannot change status from final state {} to {}", orderItem.getStatus(), status);
            throw new IllegalStateException("Cannot change status from final state: " + orderItem.getStatus());
        }
        
        // Durumu güncelle
        orderItem.setStatus(status);
        orderItemRepository.save(orderItem);

        // Sipariş durumunu genel olarak kontrol et ve gerekirse güncelle
        updateOverallOrderStatus(orderItem.getOrder());
        
        logger.info("Order item ID: {} status successfully updated to {}", orderItemId, status);
    }

    @Transactional
    public OrderItem cancelOrderItemBySeller(Long orderItemId, String userEmail) {
        logger.info("Attempting to cancel order item ID: {} by user: {}", orderItemId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", userEmail);
                    return new RuntimeException("User not found with email: " + userEmail);
                });

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> {
                    logger.error("Order item not found with ID: {}", orderItemId);
                    return new RuntimeException("Order item not found with ID: " + orderItemId);
                });

        Order order = orderItem.getOrder();
        if (order == null) {
            logger.error("Order information is missing for order item ID: {}", orderItemId);
            throw new RuntimeException("Order information is missing for the order item.");
        }
        logger.info("Order ID for item {} is {}. Current PaymentIntentId: '{}'", orderItemId, order.getId(), order.getPaymentIntentId());

        // İade öncesi siparişin en güncel halini DB'den çek
        Order freshOrder = orderRepository.findById(order.getId()).orElse(order);
        String paymentIntentId = freshOrder.getPaymentIntentId();
        logger.info("Fresh PaymentIntentId from DB for order {}: '{}'", freshOrder.getId(), paymentIntentId);

        Product product = orderItem.getProduct();
        if (product == null || product.getSeller() == null) {
            logger.error("Product or product seller information is missing for order item ID: {}", orderItemId);
            throw new RuntimeException("Product or product seller information is missing for the order item.");
        }

        // ADMIN rolü kontrolü ekle
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSeller = product.getSeller().getId().equals(user.getId());
        
        if (!isAdmin && !isSeller) {
            logger.warn("Unauthorized attempt to cancel order item ID: {} by user ID: {}. Product seller ID: {}", 
                orderItemId, user.getId(), product.getSeller().getId());
            throw new SecurityException("You are not authorized to cancel this order item as you are not the seller of the product or an admin.");
        }

        if (orderItem.getStatus() == OrderItemStatus.DELIVERED) {
            logger.warn("Attempt to cancel already DELIVERED order item ID: {}", orderItemId);
            throw new IllegalStateException("Delivered order items cannot be cancelled.");
        }

        if (orderItem.getStatus() == OrderItemStatus.CANCELLED || orderItem.getStatus() == OrderItemStatus.CANCELLED_BY_SELLER) {
            logger.warn("Attempt to cancel already CANCELLED order item ID: {}", orderItemId);
            throw new IllegalStateException("Order item is already cancelled.");
        }

        // Stripe üzerinden ödeme iadesi yap
        if (paymentIntentId != null && !paymentIntentId.isBlank()) {
            try {
                // İade edilecek tutarı hesapla: iptal edilen ürünün fiyatı * miktarı
                // Bu, OrderItem'daki priceAtPurchase kullanılmalı, çünkü ürün fiyatı değişmiş olabilir.
                long amountToRefundCents = (long) (orderItem.getPriceAtPurchase() * orderItem.getQuantity() * 100);
                logger.info("Attempting to refund {} cents for order item ID {} (Order ID: {}, PaymentIntentId: '{}')", 
                    amountToRefundCents, orderItemId, freshOrder.getId(), paymentIntentId);
                
                stripeService.refundPayment(paymentIntentId, amountToRefundCents);
                
                logger.info("Refund processed successfully by StripeService for order item ID: {}. Amount: {} cents", orderItemId, amountToRefundCents);

            } catch (StripeException e) {
                // İade başarısız olursa logla ve devam et (ürün stoğu hala güncellenmeli, sipariş durumu değişmeli)
                logger.error("Stripe refund failed for order item ID: {}. PaymentIntentId: '{}'. Error: {}", 
                    orderItemId, paymentIntentId, e.getMessage());
                // İsteğe bağlı olarak burada özel bir exception atılabilir veya farklı bir işlem yapılabilir.
            } catch (Exception e) {
                logger.error("An unexpected error occurred during refund for order item ID: {}. PaymentIntentId: '{}'. Error: {}", 
                    orderItemId, paymentIntentId, e.getMessage(), e);
            }
        } else {
            logger.warn("PaymentIntentId is null or blank for order ID: {}. Skipping refund for order item ID: {}.", 
                freshOrder.getId(), orderItemId);
        }
        
        // Stoğu geri ekle
        logger.info("Restocking product ID: {} by quantity: {} for cancelled order item ID: {}", 
            product.getId(), orderItem.getQuantity(), orderItemId);
        product.setStock(product.getStock() + orderItem.getQuantity());
        productRepository.save(product);

        orderItem.setStatus(OrderItemStatus.CANCELLED_BY_SELLER);
        OrderItem updatedOrderItem = orderItemRepository.save(orderItem);
        logger.info("Order item ID: {} status updated to CANCELLED_BY_SELLER.", orderItemId);

        // Siparişin genel durumunu güncelle
        updateOverallOrderStatus(orderItem.getOrder());

        return updatedOrderItem;
    }

    @Transactional
    public OrderItem cancelOrderItemByAdmin(Long orderItemId, String userEmail) {
        logger.info("Attempting to cancel order item ID: {} by admin: {}", orderItemId, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", userEmail);
                    return new RuntimeException("User not found with email: " + userEmail);
                });

        // Admin rolünü kontrol et
        if (user.getRole() != Role.ADMIN) {
            logger.error("Non-admin user attempted to cancel order as admin: {}", userEmail);
            throw new SecurityException("Only administrators can cancel orders using this method.");
        }

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> {
                    logger.error("Order item not found with ID: {}", orderItemId);
                    return new RuntimeException("Order item not found with ID: " + orderItemId);
                });

        Order order = orderItem.getOrder();
        if (order == null) {
            logger.error("Order information is missing for order item ID: {}", orderItemId);
            throw new RuntimeException("Order information is missing for the order item.");
        }
        logger.info("Order ID for item {} is {}. Current PaymentIntentId: '{}'", orderItemId, order.getId(), order.getPaymentIntentId());

        // İade öncesi siparişin en güncel halini DB'den çek
        Order freshOrder = orderRepository.findById(order.getId()).orElse(order);
        String paymentIntentId = freshOrder.getPaymentIntentId();
        logger.info("Fresh PaymentIntentId from DB for order {}: '{}'", freshOrder.getId(), paymentIntentId);

        Product product = orderItem.getProduct();
        if (product == null) {
            logger.error("Product information is missing for order item ID: {}", orderItemId);
            throw new RuntimeException("Product information is missing for the order item.");
        }

        if (orderItem.getStatus() == OrderItemStatus.DELIVERED) {
            logger.warn("Attempt to cancel already DELIVERED order item ID: {}", orderItemId);
            throw new IllegalStateException("Delivered order items cannot be cancelled.");
        }

        if (orderItem.getStatus() == OrderItemStatus.CANCELLED || 
            orderItem.getStatus() == OrderItemStatus.CANCELLED_BY_SELLER || 
            orderItem.getStatus() == OrderItemStatus.CANCELLED_BY_ADMIN) {
            logger.warn("Attempt to cancel already CANCELLED order item ID: {}", orderItemId);
            throw new IllegalStateException("Order item is already cancelled.");
        }

        // Stripe üzerinden ödeme iadesi yap
        if (paymentIntentId != null && !paymentIntentId.isBlank()) {
            try {
                // İade edilecek tutarı hesapla: iptal edilen ürünün fiyatı * miktarı
                long amountToRefundCents = (long) (orderItem.getPriceAtPurchase() * orderItem.getQuantity() * 100);
                logger.info("Attempting to refund {} cents for order item ID {} (Order ID: {}, PaymentIntentId: '{}')", 
                    amountToRefundCents, orderItemId, freshOrder.getId(), paymentIntentId);
                
                stripeService.refundPayment(paymentIntentId, amountToRefundCents);
                
                logger.info("Refund processed successfully by StripeService for order item ID: {}. Amount: {} cents", orderItemId, amountToRefundCents);

            } catch (StripeException e) {
                // İade başarısız olursa logla ve devam et
                logger.error("Stripe refund failed for order item ID: {}. PaymentIntentId: '{}'. Error: {}", 
                    orderItemId, paymentIntentId, e.getMessage());
            } catch (Exception e) {
                logger.error("An unexpected error occurred during refund for order item ID: {}. PaymentIntentId: '{}'. Error: {}", 
                    orderItemId, paymentIntentId, e.getMessage(), e);
            }
        } else {
            logger.warn("PaymentIntentId is null or blank for order ID: {}. Skipping refund for order item ID: {}.", 
                freshOrder.getId(), orderItemId);
        }
        
        // Stoğu geri ekle
        logger.info("Restocking product ID: {} by quantity: {} for cancelled order item ID: {}", 
            product.getId(), orderItem.getQuantity(), orderItemId);
        product.setStock(product.getStock() + orderItem.getQuantity());
        productRepository.save(product);

        // Admin tarafından iptal edildi durumu
        orderItem.setStatus(OrderItemStatus.CANCELLED_BY_ADMIN);
        OrderItem updatedOrderItem = orderItemRepository.save(orderItem);
        logger.info("Order item ID: {} status updated to CANCELLED_BY_ADMIN by {}", orderItemId, userEmail);

        // Siparişin genel durumunu güncelle
        updateOverallOrderStatus(orderItem.getOrder());

        return updatedOrderItem;
    }

    public void updateOrderStatus(Long orderId, Long sellerId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        for (OrderItem item : order.getItems()) {
            if (!item.getProduct().getSeller().getId().equals(sellerId)) {
                throw new RuntimeException("Unauthorized: Bu ürünü güncelleme yetkiniz yok.");
            }
        }

        if (newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED
                || newStatus == OrderStatus.PREPARING) {
            order.setStatus(newStatus);
            orderRepository.save(order);
        } else {
            throw new RuntimeException("Invalid status change by seller");
        }
    }

    public void cancelOrderByAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            product = productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    public List<Order> getOrdersByCustomer(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return orderRepository.findByCustomerWithDetails(user);
    }

    public double getOrderTotal(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return order.getTotalPrice();
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public void saveOrder(Order order) {
        orderRepository.save(order);
    }

    // Kullanıcı değişim talebinde bulunur
    public void requestExchange(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Bu sipariş size ait değil");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Yalnızca teslim edilen siparişler için değişim talep edilebilir.");
        }

        order.setStatus(OrderStatus.EXCHANGE_REQUESTED);
        orderRepository.save(order);
    }

    // Satıcı değişim talebini onaylar
    public void approveExchangeRequest(Long orderId, Long sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        for (OrderItem item : order.getItems()) {
            if (!item.getProduct().getSeller().getId().equals(sellerId)) {
                throw new RuntimeException("Bu sipariş ürünleri sizin değil.");
            }
        }

        if (order.getStatus() != OrderStatus.EXCHANGE_REQUESTED) {
            throw new RuntimeException("Sipariş değişim beklemiyor.");
        }

        order.setStatus(OrderStatus.PREPARING);
        orderRepository.save(order);
    }

    public boolean hasUserPurchasedProduct(String userEmail, Long productId) {
        User customer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
        return orderRepository.existsByCustomerAndProductIdAndStatus(customer, productId, OrderStatus.DELIVERED);
    }

    public List<Order> getOrdersBySeller(Long sellerId) {
        // Kullanıcının varlığını ve rolünü kontrol etmeye gerek yoksa (controller'da yapılabilir),
        // doğrudan repository metodunu çağırabiliriz.
        return orderRepository.findOrdersBySellerId(sellerId);
    }

    // Müşterinin iade talebi oluşturması
    @Transactional
    public OrderItem requestRefund(Long orderId, Long orderItemId, String reason, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        
        // Siparişin müşteriye ait olup olmadığını kontrol et
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("You are not authorized to request refund for this order.");
        }
        
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found with ID: " + orderItemId));
        
        // Sipariş kalemine ait siparişin müşteri tarafından talep edilen sipariş olup olmadığını kontrol et
        if (!orderItem.getOrder().getId().equals(orderId)) {
            throw new SecurityException("The order item does not belong to the specified order.");
        }
        
        // Ürünün teslim edilmiş olup olmadığını kontrol et
        if (orderItem.getStatus() != OrderItemStatus.DELIVERED) {
            throw new IllegalStateException("Only delivered items can be refunded.");
        }
        
        // Daha önce iade talebi oluşturulup oluşturulmadığını kontrol et
        if (orderItem.getRefundStatus() != null) {
            throw new IllegalStateException("A refund request already exists for this item.");
        }
        
        // İade talebini kaydet
        orderItem.setRefundStatus(RefundStatus.PENDING_APPROVAL);
        orderItem.setRefundReason(reason);
        orderItem.setRefundRequestedAt(LocalDateTime.now());
        
        return orderItemRepository.save(orderItem);
    }
    
    // Satıcının bekleyen iade taleplerini listelemesi
    public List<OrderItem> getRefundRequestsBySeller(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found with ID: " + sellerId));
        
        // Satıcıya ait ürünlerden iade talebi olanları bul
        // Bu özel repository sorgusu oluşturulmalı
        return orderItemRepository.findByProductSellerIdAndRefundStatus(
                sellerId, RefundStatus.PENDING_APPROVAL);
    }
    
    // Satıcının iade talebini onaylaması
    @Transactional
    public OrderItem approveRefundRequest(Long orderItemId, Long sellerId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found with ID: " + orderItemId));
        
        // Ürünün satıcıya ait olup olmadığını kontrol et
        if (!orderItem.getProduct().getSeller().getId().equals(sellerId)) {
            throw new SecurityException("You are not authorized to approve this refund request.");
        }
        
        // İade talebinin durumunu kontrol et
        if (orderItem.getRefundStatus() != RefundStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("This refund request is not in pending state.");
        }
        
        // İade talebini onayla
        orderItem.setRefundStatus(RefundStatus.APPROVED);
        orderItem.setRefundProcessedAt(LocalDateTime.now());
        orderItem.setStatus(OrderItemStatus.REFUNDED); // EXCHANGED yerine REFUNDED kullanıyoruz
        
        Order order = orderItem.getOrder();
        
        // Stripe ile ödeme iadesi işlemlerini aktifleştir
        if (order.getPaymentIntentId() != null && !order.getPaymentIntentId().isEmpty()) {
            try {
                long amountToRefundCents = (long) (orderItem.getPriceAtPurchase() * orderItem.getQuantity() * 100);
                logger.info("Attempting Stripe refund for OrderItem ID: {}, Amount: {} cents, PaymentIntentId: {}", 
                    orderItemId, amountToRefundCents, order.getPaymentIntentId());
                
                stripeService.refundPayment(order.getPaymentIntentId(), amountToRefundCents);
                
                // İade başarılı olduğunda refundStatus'u COMPLETED olarak güncelle
                orderItem.setRefundStatus(RefundStatus.COMPLETED);
                logger.info("Stripe refund successful for OrderItem ID: {}", orderItemId);
            } catch (Exception e) {
                // İade hatası durumunda loglama yap ama işlemi durdurma
                logger.error("Stripe refund failed for OrderItem ID: {}. Error: {}", orderItemId, e.getMessage(), e);
            }
        } else {
            logger.warn("PaymentIntentId is null or empty for Order ID: {}. Skipping Stripe refund for OrderItem ID: {}", 
                order.getId(), orderItemId);
        }
        
        // Sipariş durumunu güncelle
        updateOverallOrderStatus(order);
        
        return orderItemRepository.save(orderItem);
    }
    
    // Satıcının iade talebini reddetmesi
    @Transactional
    public OrderItem rejectRefundRequest(Long orderItemId, String rejectionReason, Long sellerId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found with ID: " + orderItemId));
        
        // Ürünün satıcıya ait olup olmadığını kontrol et
        if (!orderItem.getProduct().getSeller().getId().equals(sellerId)) {
            throw new SecurityException("You are not authorized to reject this refund request.");
        }
        
        // İade talebinin durumunu kontrol et
        if (orderItem.getRefundStatus() != RefundStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("This refund request is not in pending state.");
        }
        
        // İade talebini reddet
        orderItem.setRefundStatus(RefundStatus.REJECTED);
        orderItem.setRefundProcessedAt(LocalDateTime.now());
        orderItem.setRefundReason(orderItem.getRefundReason() + " | REJECTED: " + rejectionReason);
        
        return orderItemRepository.save(orderItem);
    }

    // Tüm siparişleri getiren metod (admin için)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

}
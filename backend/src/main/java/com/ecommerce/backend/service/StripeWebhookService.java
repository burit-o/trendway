package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderStatus;
import com.ecommerce.backend.repository.OrderRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookService.class);

    private final OrderRepository orderRepository;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @Transactional
    public void handleEvent(String payload, String sigHeader) throws SignatureVerificationException {
        com.stripe.model.Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
    
        if ("checkout.session.completed".equals(event.getType())) {
            logger.info("Handling checkout.session.completed event...");
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Deserialization error"));
    
            String orderIdStr = session.getMetadata().get("orderId");
            if (orderIdStr == null) {
                 logger.error("Order ID not found in webhook metadata for session: {}", session.getId());
                 return; 
            }
            Long orderId = Long.parseLong(orderIdStr);
            logger.info("Webhook received for session {}, OrderID: {}", session.getId(), orderId);

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                         logger.error("Order not found with ID: {} from webhook session: {}", orderId, session.getId());
                         return new RuntimeException("Order not found for webhook"); 
                    });
            
            String paymentStatus = session.getPaymentStatus();
            String paymentIntentId = session.getPaymentIntent();
            logger.info("Session details - PaymentStatus: {}, PaymentIntentId: {}, Order Current PaymentIntentId: {}", 
                paymentStatus, paymentIntentId, order.getPaymentIntentId());

            if ("paid".equalsIgnoreCase(paymentStatus)) {
                logger.info("Payment status is 'paid' for order ID: {}", orderId);
                if (paymentIntentId != null && !paymentIntentId.isBlank()) {
                    if (order.getPaymentIntentId() == null || !order.getPaymentIntentId().equals(paymentIntentId)) {
                        logger.info("Updating PaymentIntentId for Order ID {} from '{}' to '{}'", 
                            orderId, order.getPaymentIntentId(), paymentIntentId);
                        order.setPaymentIntentId(paymentIntentId);
                        orderRepository.save(order);
                        logger.info("Successfully saved PaymentIntentId '{}' for Order ID: {}", paymentIntentId, orderId);
                    } else {
                        logger.info("PaymentIntentId '{}' already set for Order ID {}. No update needed.", paymentIntentId, orderId);
                    }
                } else {
                    logger.warn("PaymentIntentId is NULL or blank in 'paid' webhook for session: {}, Order ID: {}. Cannot save PaymentIntentId.", 
                        session.getId(), orderId);
                }
            } else {
                logger.warn("Payment status is not 'paid' ('{}') in webhook for session: {}, Order ID: {}. PaymentIntentId will not be saved.", 
                    paymentStatus, session.getId(), orderId);
            }
        } else {
            logger.info("Received Stripe event type: {}", event.getType());
        }
    }
    
    
    

}

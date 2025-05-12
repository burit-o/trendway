package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StripeService {

    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.secret.key}")
    private String secretKey;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createCheckoutSession(List<SessionCreateParams.LineItem> lineItems, String orderId) throws Exception {
        logger.info("Creating Stripe Checkout Session for order ID: {}", orderId);
        Order order = orderRepository.findById(Long.parseLong(orderId))
                .orElseThrow(() -> {
                    logger.error("Order not found with ID: {} when creating checkout session", orderId);
                    return new RuntimeException("Order not found");
                });

        User user = order.getCustomer();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:4200/payment-success")
                .setCancelUrl("http://localhost:4200/payment-cancel")
                .addAllLineItem(lineItems)
                .putMetadata("orderId", orderId)
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder().build())
                .addExpand("payment_intent")
                .build();

        Session session = Session.create(params);
        logger.debug("Stripe Session created with ID: {}, URL: {}", session.getId(), session.getUrl());

        String paymentIntentIdFromSession = null;
        if (session.getPaymentIntentObject() != null) {
            paymentIntentIdFromSession = session.getPaymentIntentObject().getId();
            logger.info("Payment Intent ID from expanded PaymentIntentObject for order ID {}: '{}'", orderId, paymentIntentIdFromSession);
        } else if (session.getPaymentIntent() != null) {
            paymentIntentIdFromSession = session.getPaymentIntent();
            logger.info("Payment Intent ID from session.getPaymentIntent() for order ID {}: '{}'", orderId, paymentIntentIdFromSession);
        } else {
            logger.warn("Payment Intent ID is null from both getPaymentIntentObject and getPaymentIntent for order ID {}", orderId);
        }
        
        if (paymentIntentIdFromSession != null && !paymentIntentIdFromSession.isBlank()) {
            logger.info("Attempting to save PaymentIntentId '{}' to order ID: {}", paymentIntentIdFromSession, order.getId());
            order.setPaymentIntentId(paymentIntentIdFromSession);
            orderRepository.save(order);
            logger.info("Successfully saved PaymentIntentId '{}' to order ID: {}. Current value in order: '{}'", 
                paymentIntentIdFromSession, order.getId(), order.getPaymentIntentId());
        } else {
            logger.warn("PaymentIntentId was null or blank from Stripe Session for order ID: {}. Not saving to order.", orderId);
        }

        String stripeCustomerId = session.getCustomer();
        logger.info("Stripe Customer ID from session for order ID {}: '{}'", orderId, stripeCustomerId);

        if (stripeCustomerId != null && user.getStripeCustomerId() == null) {
            logger.info("Attempting to save Stripe Customer ID '{}' to user ID: {}", stripeCustomerId, user.getId());
            user.setStripeCustomerId(stripeCustomerId);
            userRepository.save(user);
            logger.info("Successfully saved Stripe Customer ID '{}' to user ID: {}", stripeCustomerId, user.getId());
        } else if (stripeCustomerId == null) {
            logger.warn("Stripe Customer ID was null from session for order ID: {}. Not saving to user.", orderId);
        } else {
            logger.info("User ID: {} already has a Stripe Customer ID: '{}'", user.getId(), user.getStripeCustomerId());
        }

        return session.getUrl();
    }

    public void refundPayment(String paymentIntentId, Long amountInCents) throws StripeException {
        logger.info("Attempting Stripe refund for PaymentIntentId: '{}', Amount: {} cents", paymentIntentId, amountInCents);
        RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId);

        if (amountInCents != null && amountInCents > 0) {
            paramsBuilder.setAmount(amountInCents);
        }

        try {
            Refund refund = Refund.create(paramsBuilder.build());
            logger.info("Stripe refund successful. Refund ID: {}, Status: {}, Amount: {}", 
                refund.getId(), refund.getStatus(), refund.getAmount());
        } catch (StripeException e) {
            logger.error("Stripe API error during refund for PaymentIntentId: '{}'. Amount: {} cents. Stripe Error Code: [{}], Message: {} \n Full Stripe Exception: ", 
                paymentIntentId, amountInCents, e.getCode(), e.getMessage(), e);
            throw e;
        }
    }

    public void refundPayment(String paymentIntentId) throws StripeException {
        logger.info("Attempting FULL Stripe refund for PaymentIntentId: '{}'", paymentIntentId);
        refundPayment(paymentIntentId, null);
    }
}
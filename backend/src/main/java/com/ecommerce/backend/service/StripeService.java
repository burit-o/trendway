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
import com.stripe.param.checkout.SessionRetrieveParams;
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
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .addAllLineItem(lineItems)
                .putMetadata("orderId", orderId)
                .setPaymentIntentData(
                    SessionCreateParams.PaymentIntentData.builder()
                        .setCaptureMethod(SessionCreateParams.PaymentIntentData.CaptureMethod.AUTOMATIC)
                        .build()
                )
                .addExpand("payment_intent")
                .build();

        Session session = Session.create(params);
        logger.debug("Stripe Session created with ID: {}, URL: {}", session.getId(), session.getUrl());

        String checkoutSessionId = session.getId();
        if (checkoutSessionId != null && !checkoutSessionId.isBlank()) {
            logger.info("Attempting to save Stripe Checkout Session ID '{}' to order ID: {}", checkoutSessionId, order.getId());
            order.setStripeCheckoutSessionId(checkoutSessionId);
            orderRepository.save(order);
            logger.info("Successfully saved Stripe Checkout Session ID '{}' to order ID: {}. Current checkout session ID in order: '{}'", 
                checkoutSessionId, order.getId(), order.getStripeCheckoutSessionId());
        } else {
            logger.warn("Stripe Checkout Session ID was null or blank for order ID: {}. Not saving to order.", orderId);
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

    private String retrievePaymentIntentId(String checkoutSessionId) throws StripeException {
        logger.debug("Retrieving PaymentIntent ID for Checkout Session ID: \'{}\'", checkoutSessionId);
        SessionRetrieveParams params = SessionRetrieveParams.builder()
            .addExpand("payment_intent")
            .build();
        Session session = Session.retrieve(checkoutSessionId, params, null);
        String paymentIntentId = session.getPaymentIntent();
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
             logger.error("Could not retrieve PaymentIntent ID from Checkout Session ID: '{}'", checkoutSessionId);
             throw new RuntimeException("PaymentIntent ID not found for the given Checkout Session ID: " + checkoutSessionId);
        }
        logger.info("Retrieved PaymentIntent ID '{}' for Checkout Session ID '{}'", paymentIntentId, checkoutSessionId);
        return paymentIntentId;
    }

    public void refundPayment(String checkoutSessionId, Long amountInCents) throws StripeException {
        logger.info("StripeService.refundPayment: Received checkoutSessionId: '{}', amountInCents: {}", checkoutSessionId, amountInCents);
        
        String paymentIntentId = retrievePaymentIntentId(checkoutSessionId);
        logger.info("StripeService.refundPayment: Retrieved PaymentIntentId: '{}' from checkoutSessionId: '{}'", paymentIntentId, checkoutSessionId);

        RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId);

        if (amountInCents != null && amountInCents > 0) {
            paramsBuilder.setAmount(amountInCents);
            logger.info("StripeService.refundPayment: Called paramsBuilder.setAmount({}) for PaymentIntentId: '{}'", amountInCents, paymentIntentId);
        } else {
            logger.warn("StripeService.refundPayment: amountInCents is '{}' (null, zero, or negative). Proceeding with FULL refund for PaymentIntentId: '{}'", amountInCents, paymentIntentId);
        }

        try {
            Refund refund = Refund.create(paramsBuilder.build());
            logger.info("Stripe refund successful via CheckoutSessionId \'{}\'. Refund ID: {}, Status: {}, Amount: {}", 
                checkoutSessionId, refund.getId(), refund.getStatus(), refund.getAmount());
        } catch (StripeException e) {
            logger.error("Stripe API error during refund attempt via CheckoutSessionId \'{}\' (PaymentIntentId: \'{}\'). Amount: {} cents. Stripe Error Code: [{}], Message: {} \\n Full Stripe Exception: ", 
                checkoutSessionId, paymentIntentId, amountInCents, e.getCode(), e.getMessage(), e);
            throw e;
        }
    }

    public void refundPayment(String checkoutSessionId) throws StripeException {
        logger.info("Attempting FULL Stripe refund for CheckoutSessionId: \'{}\'", checkoutSessionId);
        refundPayment(checkoutSessionId, null);
    }
}
package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.service.OrderService;
import com.ecommerce.backend.service.StripeService;
import com.ecommerce.backend.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeController {

    private final StripeService stripeService;
    private final OrderService orderService;
    private final StripeWebhookService stripeWebhookService;

    @PostMapping("/checkout-session/{orderId}")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);

            List<SessionCreateParams.LineItem> lineItems = order.getItems().stream().map(item ->
                    SessionCreateParams.LineItem.builder()
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("usd")
                                            .setUnitAmount((long) (item.getPriceAtPurchase() * 100)) // cent
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName(item.getProduct().getName())
                                                            .build()
                                            )
                                            .build()
                            )
                            .setQuantity((long) item.getQuantity())
                            .build()
            ).toList();

            String checkoutUrl = stripeService.createCheckoutSession(lineItems, order.getId().toString());
            return ResponseEntity.ok(Collections.singletonMap("checkoutUrl", checkoutUrl));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Checkout session error: " + e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(HttpServletRequest request, @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            String payload = IOUtils.toString(request.getInputStream(), StandardCharsets.UTF_8);
            stripeWebhookService.handleEvent(payload, sigHeader);
            return ResponseEntity.ok("Webhook received");
        } catch (SignatureVerificationException | IOException e) {
            return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
        }
    }
    
}

package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.OrderStatus;
import com.ecommerce.backend.repository.OrderRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private final OrderRepository orderRepository;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    public void handleEvent(String payload, String sigHeader) throws SignatureVerificationException {
        com.stripe.model.Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
    
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new RuntimeException("Deserialization error"));
    
            String orderIdStr = session.getMetadata().get("orderId");
            Long orderId = Long.parseLong(orderIdStr);
    
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
    
            // Burada ödeme başarılı veya başarısız fark etmeksizin doğrudan PREPARING'e geçiyoruz.
            order.setStatus(OrderStatus.PREPARING); // Ödeme durumunu beklemeden PREPARING'e alıyoruz.
            order.setPaymentIntentId(session.getPaymentIntent());  // PaymentIntent ID'yi saklıyoruz
    
            orderRepository.save(order);
        }
    }
    
    
    

}

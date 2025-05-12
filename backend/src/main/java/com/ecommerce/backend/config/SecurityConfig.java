package com.ecommerce.backend.config;

import com.ecommerce.backend.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/products/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/product/{productId}").permitAll()
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/payment/webhook").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/cart/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/user/update-address").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/refund").hasRole("ADMIN")
                        .requestMatchers("/api/orders/cancel").hasRole("ADMIN")
                        .requestMatchers("/api/orders/update-status").hasRole("SELLER")
                        .requestMatchers("/api/orders/approve-exchange").hasRole("SELLER")
                        .requestMatchers("/api/orders/from-cart").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/request-exchange").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/orders/{orderId}/request-refund").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/by-customer").hasAnyRole("CUSTOMER", "USER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/seller").hasRole("SELLER")
                        .requestMatchers(HttpMethod.GET, "/api/orders/refund-requests/by-seller").hasRole("SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/item/{orderItemId}/cancel-by-seller").hasRole("SELLER")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/update-item-status").hasAnyRole("ADMIN", "SELLER")
                        .requestMatchers("/api/orders/**").authenticated()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
    

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

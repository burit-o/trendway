package com.ecommerce.backend.service;

import com.ecommerce.backend.model.Role;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public User registerUser(String fullName, String email, String password, Role role) {
        if (emailExists(email)) {
            throw new RuntimeException("Email already in use.");
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();

        return userRepository.save(user);
    }

    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBanned(true);
        userRepository.save(user);
    }

    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBanned(false);
        userRepository.save(user);
    }

    public boolean changeUserPassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            // Mevcut şifre yanlış
            // Burada özel bir exception fırlatmak veya false dönmek yerine,
            // controller katmanında handle edilecek bir mesajla false dönebiliriz.
            // Ya da direkt bir exception fırlatıp controller bunu yakalayabilir.
            // Şimdilik bir RuntimeException fırlatalım.
            throw new RuntimeException("Incorrect current password.");
        }

        if (newPassword == null || newPassword.isEmpty()) {
            throw new RuntimeException("New password cannot be empty.");
        }
        
        // Yeni şifre mevcut şifre ile aynı olmamalı gibi ek kontroller de eklenebilir.

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true; // Başarılı
    }
}

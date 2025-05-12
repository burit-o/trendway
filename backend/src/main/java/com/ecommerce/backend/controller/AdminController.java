package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Role;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @GetMapping("/seller-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getSellerRequests() {
        List<User> pendingRequests = userRepository.findAll().stream()
                .filter(User::isSellerRequested)
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendingRequests);
    }

    @PutMapping("/users/{userId}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> banUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body("Admin users cannot be banned");
        }

        user.setBanned(true);
        userRepository.save(user);
        return ResponseEntity.ok("User banned successfully");
    }

    @PutMapping("/users/{userId}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> unbanUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBanned(false);
        userRepository.save(user);
        return ResponseEntity.ok("User unbanned successfully");
    }

    @PutMapping("/reject-seller-request/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> rejectSellerRequest(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isSellerRequested()) {
            return ResponseEntity.badRequest().body("User does not have a pending seller request.");
        }

        user.setSellerRequested(false);
        userRepository.save(user);

        return ResponseEntity.ok("Seller request rejected successfully.");
    }
} 
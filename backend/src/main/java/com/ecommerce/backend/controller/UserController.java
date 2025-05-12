package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.UpdateAddressRequest;
import com.ecommerce.backend.model.Address;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import com.ecommerce.backend.repository.AddressRepository;
import com.ecommerce.backend.model.Role;
import lombok.RequiredArgsConstructor;
import com.ecommerce.backend.dto.ChangePasswordRequest;
import com.ecommerce.backend.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final UserService userService;

    @PutMapping("/update-address")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> updateAddress(@RequestBody UpdateAddressRequest request, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Birden fazla adres varsa ve istenen adresin id'sine göre adresi bul
        Address address = user.getAddresses().stream()
                .filter(addr -> addr.getId().equals(request.getAddressId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Address not found"));

        boolean changed = false;

        // Adres güncellemeleri
        if (request.getAddressLine() != null && !request.getAddressLine().equals(address.getAddressLine())) {
            address.setAddressLine(request.getAddressLine());
            changed = true;
        }
        if (request.getCity() != null && !request.getCity().equals(address.getCity())) {
            address.setCity(request.getCity());
            changed = true;
        }
        if (request.getPostalCode() != null && !request.getPostalCode().equals(address.getPostalCode())) {
            address.setPostalCode(request.getPostalCode());
            changed = true;
        }
        if (request.getCountry() != null && !request.getCountry().equals(address.getCountry())) {
            address.setCountry(request.getCountry());
            changed = true;
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(address.getPhoneNumber())) {
            address.setPhoneNumber(request.getPhoneNumber());
            changed = true;
        }

        if (changed) {
            addressRepository.save(address); // Değişiklikler kaydediliyor
            return ResponseEntity.ok("Adres bilgileri başarıyla güncellendi.");
        } else {
            return ResponseEntity.ok("Adres bilgileri zaten güncel.");
        }
    }

    @PostMapping("/add-address")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> addAddress(@RequestBody Address request, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        request.setUser(user);
        addressRepository.save(request);

        return ResponseEntity.ok("Adres başarıyla eklendi.");
    }

    @PutMapping("/ban/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> banUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body("Admin kullanıcı banlanamaz.");
        }

        user.setBanned(true);
        userRepository.save(user);

        return ResponseEntity.ok("Kullanıcı başarıyla banlandı.");
    }

    @PutMapping("/unban/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> unbanUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setBanned(false);
        userRepository.save(user);

        return ResponseEntity.ok("Kullanıcının ban'ı kaldırıldı.");
    }

    @PutMapping("/approve-seller-request/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveSellerRequest(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.CUSTOMER) {
            return ResponseEntity.badRequest().body("User is already a seller.");
        }

        user.setRole(Role.SELLER); // Kullanıcının rolünü SELLER olarak değiştir
        user.setSellerRequested(false); // Başvuru onaylandı, başvuru durumu false
        userRepository.save(user);

        return ResponseEntity.ok("Seller request approved and role updated.");
    }

    @PutMapping("/request-seller-status")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> requestSellerStatus(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.SELLER) {
            return ResponseEntity.badRequest().body("User is already a seller.");
        }
        if (user.getRole() == Role.ADMIN) {
             return ResponseEntity.badRequest().body("Admin cannot request seller status.");
        }
        if (user.isBanned()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Banned users cannot request seller status.");
        }
        if (user.isSellerRequested()) {
            return ResponseEntity.ok("Seller request is already pending.");
        }

        user.setSellerRequested(true);
        userRepository.save(user);

        return ResponseEntity.ok("Seller status request submitted successfully. Please wait for admin approval.");
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SELLER', 'ADMIN')")
    public ResponseEntity<User> getCurrentUser(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }
        String email = principal.getName();
        try {
            boolean success = userService.changeUserPassword(email, request.getCurrentPassword(), request.getNewPassword());
            if (success) {
                return ResponseEntity.ok("Password changed successfully.");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to change password due to an unexpected error.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

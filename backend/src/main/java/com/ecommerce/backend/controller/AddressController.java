package com.ecommerce.backend.controller;

import com.ecommerce.backend.model.Address;
import com.ecommerce.backend.model.Role;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.AddressRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Address>> getUserAddresses(@PathVariable Long userId, Principal principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found with email: " + principal.getName()));

        if (authenticatedUser.getRole() != Role.ADMIN && !authenticatedUser.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.ok(List.of());
        }

        List<Address> addresses = addressRepository.findByUser(targetUser);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping
    public ResponseEntity<Address> addAddress(@RequestBody Address address, Principal principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found with email: " + principal.getName()));

        address.setUser(authenticatedUser);
        address.setId(null);
        Address savedAddress = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAddress);
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<Address> updateAddress(@PathVariable Long addressId, @RequestBody Address addressDetails, Principal principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found with email: " + principal.getName()));

        Optional<Address> optionalAddress = addressRepository.findById(addressId);
        if (optionalAddress.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Address existingAddress = optionalAddress.get();

        if (!existingAddress.getUser().getId().equals(authenticatedUser.getId()) && authenticatedUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (addressDetails.getAddressLine() != null) {
            existingAddress.setAddressLine(addressDetails.getAddressLine());
        }
        if (addressDetails.getCity() != null) {
            existingAddress.setCity(addressDetails.getCity());
        }
        if (addressDetails.getState() != null) {
            existingAddress.setState(addressDetails.getState());
        }
        if (addressDetails.getPostalCode() != null) {
            existingAddress.setPostalCode(addressDetails.getPostalCode());
        }
        if (addressDetails.getCountry() != null) {
            existingAddress.setCountry(addressDetails.getCountry());
        }
        if (addressDetails.getPhoneNumber() != null) {
            existingAddress.setPhoneNumber(addressDetails.getPhoneNumber());
        }

        Address updatedAddress = addressRepository.save(existingAddress);
        return ResponseEntity.ok(updatedAddress);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId, Principal principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found with email: " + principal.getName()));

        Address addressToDelete = addressRepository.findById(addressId)
                .orElse(null);

        if (addressToDelete == null) {
            return ResponseEntity.notFound().build();
        }

        if (!addressToDelete.getUser().getId().equals(authenticatedUser.getId()) && authenticatedUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        addressRepository.deleteById(addressId);
        return ResponseEntity.ok().build();
    }
} 
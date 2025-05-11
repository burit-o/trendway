package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Address;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressDto {
    private Long id;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String contactName;
    private String phoneNumber;

    public static AddressDto fromEntity(Address address) {
        if (address == null) return null;
        return AddressDto.builder()
                .id(address.getId())
                .addressLine(address.getAddressLine())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .contactName(address.getContactName())
                .phoneNumber(address.getPhoneNumber())
                .build();
    }
} 
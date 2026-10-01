package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Address;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Address}
 */
public record AddressResponseDTO(
        UUID id,
        UUID userId,
        String street,
        String number,
        String complement,
        String neighborhood,
        String city,
        String state,
        String zipCode,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {

  public AddressResponseDTO(Address entity) {
    this (
            entity.getId(),
            entity.getUser().getId(),
            entity.getStreet(),
            entity.getNumber(),
            entity.getComplement(),
            entity.getNeighborhood(),
            entity.getCity(),
            entity.getState(),
            entity.getZipCode(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
    );
  }

}
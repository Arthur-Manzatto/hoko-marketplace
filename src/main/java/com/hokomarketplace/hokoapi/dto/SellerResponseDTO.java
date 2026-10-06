package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Seller;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Seller}
 */
public record SellerResponseDTO(
        UUID id,
        UUID userId,
        String storeName,
        String slug,
        String document,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {

  public SellerResponseDTO(Seller entity) {
    this(
            entity.getId(),
            entity.getUser().getId(),
            entity.getStoreName(),
            entity.getSlug(),
            entity.getDocument(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
    );
  }
}
package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Category;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Category}
 */
public record CategoryResponseDTO(
        UUID id,
        String name,
        String slug,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {

  public CategoryResponseDTO(Category entity) {
    this (
            entity.getId(),
            entity.getName(),
            entity.getSlug(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
    );
  }

}
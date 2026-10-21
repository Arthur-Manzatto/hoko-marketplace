package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Product;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Product}
 */
public record ProductSummaryDTO(
        UUID id,
        String name,
        String slug,
        BigDecimal price,
        Integer quantity,
        String coverImageUrl,
        String categoryName,
        String categorySlug,
        String sellerStoreName,
        String sellerSlug

) implements Serializable {

  public ProductSummaryDTO(Product entity) {
    this(
            entity.getId(),
            entity.getName(),
            entity.getSlug(),
            entity.getPrice(),
            entity.getQuantity(),
            entity.getImages().isEmpty() ? null: entity.getImages().getFirst().getUrl(),
            entity.getCategory().getName(),
            entity.getCategory().getSlug(),
            entity.getSeller().getStoreName(),
            entity.getSeller().getSlug()
    );
  }
}
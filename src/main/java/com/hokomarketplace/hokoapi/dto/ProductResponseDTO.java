package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Product;
import com.hokomarketplace.hokoapi.entity.ProductImage;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Product}
 */
public record ProductResponseDTO(
        UUID id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        Integer quantity,
        List<String> imageUrls,
        UUID sellerId,
        String sellerStoreName,
        String sellerSlug,
        UUID categoryId,
        String categoryName,
        String categorySlug,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt
) implements Serializable {

    public ProductResponseDTO(Product entity) {
        this(
                entity.getId(),
                entity.getName(),
                entity.getSlug(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getQuantity(),
                entity.getImages().stream().map(ProductImage::getUrl).toList(),
                entity.getSeller().getId(),
                entity.getSeller().getStoreName(),
                entity.getSeller().getSlug(),
                entity.getCategory().getId(),
                entity.getCategory().getName(),
                entity.getCategory().getSlug(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getDeletedAt()
        );
    }

}
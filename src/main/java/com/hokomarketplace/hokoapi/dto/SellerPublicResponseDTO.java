package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Seller;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO público de {@link Seller} para a vitrine: sem documento (CPF/CNPJ) e sem userId.
 */
public record SellerPublicResponseDTO(
        UUID id,
        String storeName,
        String slug,
        Instant createdAt,
        Instant deletedAt
) implements Serializable {

    public SellerPublicResponseDTO(Seller entity) {
        this(
                entity.getId(),
                entity.getStoreName(),
                entity.getSlug(),
                entity.getCreatedAt(),
                entity.getDeletedAt()
        );
    }
}

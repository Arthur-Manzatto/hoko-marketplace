package com.hokomarketplace.hokoapi.dto.filters;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Product}
 */

public record ProductFilter(
        String search,
        UUID categoryId,
        String categorySlug,
        UUID sellerId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Boolean inStock
) implements Serializable { }

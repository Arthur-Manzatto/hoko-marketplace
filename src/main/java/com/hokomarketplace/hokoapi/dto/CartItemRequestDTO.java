package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.CartItem}
 */
public record CartItemRequestDTO(
        @NotNull
        UUID productId,

        @NotNull
        @Min(1)
        @Max(99)
        Integer quantity
) implements Serializable { }

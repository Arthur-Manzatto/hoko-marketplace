package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.CartItem}
 */
public record CartQuantityDTO(
        @NotNull
        @Min(1)
        @Max(99)
        Integer quantity
) implements Serializable { }

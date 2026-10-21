package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Product}
 */
public record ProductStockDTO(
        @NotNull
        @Min(0)
        Integer quantity
) implements Serializable { }
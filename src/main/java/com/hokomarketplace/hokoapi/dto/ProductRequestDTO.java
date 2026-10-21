package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Product}
 */
public record ProductRequestDTO(

        @Size(min = 3, max = 120)
        @NotBlank
        String name,

        @Size(max = 5000)
        String description,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 10, fraction = 2)
        BigDecimal price,

        @NotNull
        @Min(0)
        Integer quantity,

        @NotNull
        UUID categoryId,

        @Size(max = 8, message = "A product can have at most 8 images")
        List<
                @NotBlank
                @Size(max = 2048)
                @Pattern(regexp = "^https://.+", message = "Image URL must be https")
                String
        > imageUrls

) implements Serializable { }
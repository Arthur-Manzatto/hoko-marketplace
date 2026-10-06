package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Seller}
 */
public record SellerRequestDTO(

        @NotBlank
        @Size(min = 3, max = 100)
        String storeName,

        @NotBlank
        @Pattern(message = "Document must contain 11 or 14 digits", regexp = "^\\\\d{11}$|^\\\\d{14}$")
        String document
) implements Serializable {  }
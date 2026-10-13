package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Address}
 */
public record AddressRequestDTO(
        @Size(max = 30)
        String label,

        @NotBlank
        @Size(max = 255)
        String street,

        @NotBlank
        @Size(max = 20)
        String number,

        @Size(max = 100)
        String complement,

        @NotBlank
        @Size(max = 100)
        String neighborhood,

        @NotBlank
        @Size(max = 100)
        String city,

        @NotBlank
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "State must be the 2-letter UF code")
        String state,

        @NotBlank
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Zip code must be 00000-000 or 00000000")
        String zipCode
) implements Serializable {  }
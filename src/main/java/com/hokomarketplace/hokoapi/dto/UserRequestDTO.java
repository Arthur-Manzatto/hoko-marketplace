package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.User}
 */
public record UserRequestDTO(
        @Size(min = 3, max = 50)
        @NotBlank
        String name,

        @Size(max = 60)
        @Email
        @NotBlank
        String email,

        @Size(max = 11)
        @Pattern(message = "Phone must contain 10 or 11 digits", regexp = "^\\d{10,11}$")
        @NotBlank String phone
) implements Serializable { }
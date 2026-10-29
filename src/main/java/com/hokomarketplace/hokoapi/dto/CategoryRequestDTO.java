package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.Category}
 */
public record CategoryRequestDTO(
        @NotBlank(message = "Name is required")
        @Size(min = 3, max = 50, message = "Name must be between 3 and 50 characters")
        String name,

        @NotBlank(message = "Icon is required")
        @Size(max = 50)
        @Pattern(regexp = "^bi-[a-z0-9-]+$", message = "Icon must be a Bootstrap Icons class, e.g. bi-phone")
        String icon,

        @Size(max = 160, message = "Description must be at most 160 characters")
        String description
) implements Serializable { }
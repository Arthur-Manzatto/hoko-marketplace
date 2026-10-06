package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.User;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link com.hokomarketplace.hokoapi.entity.User}
 */
public record UserResponseDTO(
        UUID id,
        String name,
        String email,
        String phone,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt
) implements Serializable {

    public UserResponseDTO(User entity) {
        this (
                entity.getId(),
                entity.getName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getDeletedAt()
        );
    }

}
package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.User;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Usuário logado: perfil + loja (null se ainda não é vendedor) + se é admin.
 * Uma chamada só para o front decidir o que mostrar.
 */
public record MeResponseDTO(
        UUID id,
        String name,
        String email,
        String phone,
        Instant createdAt,
        boolean admin,
        SellerResponseDTO seller
) implements Serializable {

    public MeResponseDTO(User user, Seller seller, boolean admin) {
        this(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getCreatedAt(),
                admin,
                seller == null ? null : new SellerResponseDTO(seller)
        );
    }
}

package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.CartItem;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * O carrinho do usuário. totalItems e subtotal contam só os itens disponíveis.
 */
public record CartResponseDTO(
        List<CartItemDTO> items,
        int totalItems,
        BigDecimal subtotal
) implements Serializable {

    public static CartResponseDTO of(List<CartItem> entities) {
        List<CartItemDTO> items = entities.stream().map(CartItemDTO::new).toList();
        List<CartItemDTO> available = items.stream().filter(CartItemDTO::available).toList();

        int totalItems = available.stream().mapToInt(CartItemDTO::quantity).sum();
        BigDecimal subtotal = available.stream()
                .map(CartItemDTO::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponseDTO(items, totalItems, subtotal);
    }
}

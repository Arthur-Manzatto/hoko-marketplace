package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.CartItem;
import com.hokomarketplace.hokoapi.entity.Product;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Uma linha do carrinho. O preço é sempre o atual do produto.
 * available = false quando o produto foi apagado ou não tem estoque para a quantidade.
 */
public record CartItemDTO(
        UUID id,
        UUID productId,
        String name,
        String slug,
        String coverImageUrl,
        String sellerStoreName,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal,
        Integer stock,
        boolean available
) implements Serializable {

    public CartItemDTO(CartItem item) {
        this(item, item.getProduct());
    }

    private CartItemDTO(CartItem item, Product product) {
        this(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getImages().isEmpty() ? null : product.getImages().getFirst().getUrl(),
                product.getSeller().getStoreName(),
                product.getPrice(),
                item.getQuantity(),
                product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                product.getQuantity(),
                product.getDeletedAt() == null && product.getQuantity() >= item.getQuantity()
        );
    }
}

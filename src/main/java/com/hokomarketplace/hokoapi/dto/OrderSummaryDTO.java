package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import com.hokomarketplace.hokoapi.entity.enums.PaymentStatus;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Pedido na lista "Meus pedidos".
 */
public record OrderSummaryDTO(
        UUID id,
        OrderStatus status,
        BigDecimal total,
        int itemCount,
        String sellerStoreName,
        String sellerSlug,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        Instant createdAt
) implements Serializable {

    public OrderSummaryDTO(Order entity) {
        this(
                entity.getId(),
                entity.getStatus(),
                entity.getTotal(),
                entity.getItems().stream().mapToInt(i -> i.getQuantity()).sum(),
                entity.getSeller().getStoreName(),
                entity.getSeller().getSlug(),
                entity.getPayment() == null ? null : entity.getPayment().getMethod(),
                entity.getPayment() == null ? null : entity.getPayment().getStatus(),
                entity.getCreatedAt()
        );
    }
}

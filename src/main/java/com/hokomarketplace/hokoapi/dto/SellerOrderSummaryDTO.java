package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.OrderItem;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import com.hokomarketplace.hokoapi.entity.enums.PaymentStatus;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Pedido na lista de vendas da loja. Do comprador, só o nome.
 */
public record SellerOrderSummaryDTO(
        UUID id,
        OrderStatus status,
        BigDecimal total,
        int itemCount,
        String buyerName,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        Instant createdAt,
        Instant shippedAt
) implements Serializable {

    public SellerOrderSummaryDTO(Order entity) {
        this(
                entity.getId(),
                entity.getStatus(),
                entity.getTotal(),
                entity.getItems().stream().mapToInt(OrderItem::getQuantity).sum(),
                entity.getUser().getName(),
                entity.getPayment() == null ? null : entity.getPayment().getMethod(),
                entity.getPayment() == null ? null : entity.getPayment().getStatus(),
                entity.getCreatedAt(),
                entity.getShippedAt()
        );
    }
}

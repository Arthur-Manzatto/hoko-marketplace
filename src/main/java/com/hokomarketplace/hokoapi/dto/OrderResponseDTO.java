package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.OrderItem;
import com.hokomarketplace.hokoapi.entity.Payment;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import com.hokomarketplace.hokoapi.entity.enums.PaymentStatus;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Detalhe do pedido. Endereço, nomes, preços e fotos são os do momento da compra.
 */
public record OrderResponseDTO(
        UUID id,
        OrderStatus status,
        BigDecimal subtotal,
        BigDecimal shippingCost,
        BigDecimal total,
        String sellerStoreName,
        String sellerSlug,
        ShippingAddress shippingAddress,
        List<Item> items,
        PaymentInfo payment,
        Instant createdAt,
        Instant updatedAt
) implements Serializable {

    public record ShippingAddress(
            String street, String number, String complement, String neighborhood,
            String city, String state, String zipCode
    ) implements Serializable { }

    public record Item(
            UUID productId,
            String productName,
            String productSlug,   // null se o produto saiu da vitrine
            String imageUrl,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal lineTotal
    ) implements Serializable {

        Item(OrderItem item) {
            this(
                    item.getProduct() == null ? null : item.getProduct().getId(),
                    item.getProductName(),
                    item.getProduct() == null || item.getProduct().getDeletedAt() != null
                            ? null : item.getProduct().getSlug(),
                    item.getProductImageUrl(),
                    item.getUnitPrice(),
                    item.getQuantity(),
                    item.getLineTotal()
            );
        }
    }

    public record PaymentInfo(
            PaymentMethod method,
            PaymentStatus status,
            BigDecimal amount,
            int installments,
            Instant paidAt
    ) implements Serializable {

        PaymentInfo(Payment payment) {
            this(payment.getMethod(), payment.getStatus(), payment.getAmount(),
                    payment.getInstallments(), payment.getPaidAt());
        }
    }

    public OrderResponseDTO(Order entity) {
        this(
                entity.getId(),
                entity.getStatus(),
                entity.getSubtotal(),
                entity.getShippingCost(),
                entity.getTotal(),
                entity.getSeller().getStoreName(),
                entity.getSeller().getSlug(),
                new ShippingAddress(
                        entity.getShipStreet(), entity.getShipNumber(), entity.getShipComplement(),
                        entity.getShipNeighborhood(), entity.getShipCity(), entity.getShipState(),
                        entity.getShipZipCode()),
                entity.getItems().stream().map(Item::new).toList(),
                entity.getPayment() == null ? null : new PaymentInfo(entity.getPayment()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}

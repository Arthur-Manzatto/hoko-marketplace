package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Map;

/**
 * Resumo das vendas da loja.
 * revenue = já pago (PAID + SHIPPED + DELIVERED); pendingRevenue = aguardando pagamento;
 * toShip = pedidos pagos que a loja precisa despachar.
 */
public record SalesSummaryDTO(
        Map<OrderStatus, Long> ordersByStatus,
        BigDecimal revenue,
        BigDecimal pendingRevenue,
        long toShip
) implements Serializable { }

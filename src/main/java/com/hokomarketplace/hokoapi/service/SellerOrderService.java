package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.dto.SalesSummaryDTO;
import com.hokomarketplace.hokoapi.dto.SellerOrderSummaryDTO;
import com.hokomarketplace.hokoapi.dto.ShipOrderDTO;
import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.repository.OrderRepository;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Pedidos recebidos pela loja do usuário logado: listar, enviar, entregar, cancelar e resumo. */
@Service
public class SellerOrderService {

    private static final Set<OrderStatus> PAID_STATUSES = Set.of(OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final OrderRepository repository;
    private final SellerService sellerService;
    private final OrderService orderService;

    public SellerOrderService(OrderRepository repository, SellerService sellerService, OrderService orderService) {
        this.repository = repository;
        this.sellerService = sellerService;
        this.orderService = orderService;
    }

    @Transactional(readOnly = true)
    public Page<SellerOrderSummaryDTO> findMine(UUID userId, OrderStatus status, Pageable pageable) {
        UUID sellerId = store(userId).getId();
        Page<Order> page = status == null
                ? repository.findBySellerId(sellerId, pageable)
                : repository.findBySellerIdAndStatus(sellerId, status, pageable);
        return page.map(SellerOrderSummaryDTO::new);
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO get(UUID userId, UUID id) {
        return new OrderResponseDTO(owned(userId, id));
    }

    @Transactional
    public OrderResponseDTO ship(UUID userId, UUID id, ShipOrderDTO dto) {
        Order order = owned(userId, id);
        String tracking = dto == null || dto.trackingCode() == null || dto.trackingCode().isBlank()
                ? null : dto.trackingCode().trim().toUpperCase();
        order.ship(tracking);
        return new OrderResponseDTO(repository.saveAndFlush(order));
    }

    @Transactional
    public OrderResponseDTO deliver(UUID userId, UUID id) {
        Order order = owned(userId, id);
        order.deliver();
        return new OrderResponseDTO(repository.saveAndFlush(order));
    }

    /** A loja desiste do pedido antes de enviar: mesmo efeito do cancelamento do comprador. */
    @Transactional
    public OrderResponseDTO cancel(UUID userId, UUID id) {
        return orderService.cancelAndRestock(owned(userId, id));
    }

    @Transactional(readOnly = true)
    public SalesSummaryDTO summary(UUID userId) {
        UUID sellerId = store(userId).getId();

        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            byStatus.put(status, 0L);
        }
        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;

        for (OrderRepository.StatusTotal row : repository.sumBySeller(sellerId)) {
            byStatus.put(row.getStatus(), row.getCount());
            if (PAID_STATUSES.contains(row.getStatus())) {
                revenue = revenue.add(row.getTotal());
            } else if (row.getStatus() == OrderStatus.PENDING) {
                pending = pending.add(row.getTotal());
            }
        }

        return new SalesSummaryDTO(byStatus, revenue, pending, byStatus.get(OrderStatus.PAID));
    }

    private Seller store(UUID userId) {
        return sellerService.getByUserId(userId, false);
    }

    private Order owned(UUID userId, UUID id) {
        return repository.findByIdAndSellerId(id, store(userId).getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + id + " for this store"));
    }
}

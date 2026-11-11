package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @EntityGraph(attributePaths = {"seller", "payment"})
    Page<Order> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"seller", "payment"})
    Page<Order> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);

    // filtrar pelo usuário: pedido de outra pessoa vira 404
    @EntityGraph(attributePaths = {"seller", "payment", "items"})
    Optional<Order> findByIdAndUserId(UUID id, UUID userId);
}

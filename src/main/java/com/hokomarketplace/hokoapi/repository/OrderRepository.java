package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Order;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @EntityGraph(attributePaths = {"seller", "payment"})
    Page<Order> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"seller", "payment"})
    Page<Order> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);

    // filtrar pelo usuário: pedido de outra pessoa vira 404
    @EntityGraph(attributePaths = {"user", "seller", "payment", "items"})
    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    // ------------------------------------------------------------ vendedor

    @EntityGraph(attributePaths = {"user", "payment"})
    Page<Order> findBySellerId(UUID sellerId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "payment"})
    Page<Order> findBySellerIdAndStatus(UUID sellerId, OrderStatus status, Pageable pageable);

    // filtrar pela loja: pedido de outra loja vira 404
    @EntityGraph(attributePaths = {"user", "seller", "payment", "items"})
    Optional<Order> findByIdAndSellerId(UUID id, UUID sellerId);

    @Query("select o.status as status, count(o) as count, coalesce(sum(o.total), 0) as total " +
            "from CustomerOrder o where o.seller.id = :sellerId group by o.status")
    List<StatusTotal> sumBySeller(@Param("sellerId") UUID sellerId);

    /** Quantidade e soma dos pedidos de um status. */
    interface StatusTotal {
        OrderStatus getStatus();
        long getCount();
        BigDecimal getTotal();
    }
}

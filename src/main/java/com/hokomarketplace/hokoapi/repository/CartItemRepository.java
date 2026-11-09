package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    // carrinho inteiro de uma vez (as fotos vêm pelo @BatchSize do Product)
    @EntityGraph(attributePaths = {"product", "product.seller", "product.category"})
    List<CartItem> findByUserIdOrderByCreatedAtAsc(UUID userId);

    Optional<CartItem> findByUserIdAndProductId(UUID userId, UUID productId);

    // filtrar pelo usuário: item de outra pessoa vira 404
    @EntityGraph(attributePaths = {"product"})
    Optional<CartItem> findByIdAndUserId(UUID id, UUID userId);

    // um DELETE só, sem carregar item por item como o deleteBy derivado
    @Modifying
    @Query("delete from CartItem c where c.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}

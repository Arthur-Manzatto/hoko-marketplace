package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"category", "seller"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "seller"})
    Optional<Product> findByIdAndDeletedAtIsNull(UUID id);

    @EntityGraph(attributePaths = {"category", "seller"})
    Optional<Product> findBySlugAndDeletedAtIsNull(String slug);

    @EntityGraph(attributePaths = {"category", "seller"})
    Optional<Product> findByIdAndSellerIdAndDeletedAtIsNull(UUID id, UUID sellerId);

    Optional<Product> findBySlug(String slug);

    // baixa atômica: só desconta se ainda houver estoque. 0 = não deu (outra compra levou antes)
    @Modifying
    @Query("update Product p set p.quantity = p.quantity - :qty " +
            "where p.id = :id and p.deletedAt is null and p.quantity >= :qty")
    int decrementStock(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying
    @Query("update Product p set p.quantity = p.quantity + :qty where p.id = :id")
    int incrementStock(@Param("id") UUID id, @Param("qty") int qty);

}
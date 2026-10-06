package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Seller;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SellerRepository extends JpaRepository<Seller, UUID> {

    @Query("SELECT s FROM Seller s WHERE s.deletedAt IS NULL")
    Page<Seller> findAllActive(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Seller> findById(UUID id);

    @EntityGraph(attributePaths = "user")
    @Query("SELECT s FROM Seller s WHERE s.deletedAt IS NULL AND s.id = :id")
    Optional<Seller> findByIdActive(@Param("id") UUID id);

    @EntityGraph(attributePaths = "user")
    Optional<Seller> findByUserId(UUID userId);

    @EntityGraph(attributePaths = "user")
    @Query("SELECT s FROM Seller s WHERE s.deletedAt IS NULL AND s.user.id = :userId")
    Optional<Seller> findByUserIdActive(@Param("userId") UUID userId);

    @EntityGraph(attributePaths = "user")
    Optional<Seller> findBySlug(String slug);

    Page<Seller> findByStoreNameSearchContaining(String storeNameSearch, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    @Query("SELECT s FROM Seller s WHERE s.deletedAt IS NULL AND s.storeNameSearch LIKE CONCAT('%', :storeNameSearch, '%')")
    Page<Seller> findByStoreNameSearchContainingActive(String storeNameSearch, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    @Query("SELECT s FROM Seller s WHERE s.deletedAt IS NULL AND s.slug = :slug")
    Optional<Seller> findBySlugActive(@Param("slug") String slug);
}
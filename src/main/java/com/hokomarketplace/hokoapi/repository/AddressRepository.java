package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Address;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    @EntityGraph(attributePaths = "user")
    @Query("SELECT a FROM Address a WHERE a.deletedAt IS NULL AND a.user.id = :userId")
    Page<Address> findByUserIdActive(@Param("userId") UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    @Query("SELECT a FROM Address a WHERE a.deletedAt IS NULL AND a.user.id = :userId AND a.id = :id")
    Optional<Address> findByUserIdAndIdActive(@Param("userId") UUID userId, @Param("id") UUID id);

    @EntityGraph(attributePaths = "user")
    Page<Address> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Address> findByUserIdAndId(UUID userId, UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Address a SET a.isDefault = false " +
            "WHERE a.user.id = :userId AND a.id <> :id AND a.isDefault = true")
    int clearDefaultExcept(@Param("userId") UUID userId, @Param("id") UUID id);

}
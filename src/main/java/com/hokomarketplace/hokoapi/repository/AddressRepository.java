package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Address;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    @EntityGraph(attributePaths = "user")
    Page<Address> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Address> findByUserIdAndId(UUID userId, UUID id);

}
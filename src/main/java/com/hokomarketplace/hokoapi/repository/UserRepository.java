package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Page<User> findByNameSearchContaining(
            String nameSearch,
            Pageable pageable
    );
}
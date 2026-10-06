package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    Page<User> findAllActive(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.id = :id")
    Optional<User> findByIdActive(@Param("id") UUID id);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.email = :email")
    Optional<User> findByEmailActive(@Param("email") String email);

    Page<User> findByNameSearchContaining(String nameSearch, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.nameSearch LIKE CONCAT('%', :nameSearch, '%')")
    Page<User> findByNameSearchContainingActive(String nameSearch, Pageable pageable);

}
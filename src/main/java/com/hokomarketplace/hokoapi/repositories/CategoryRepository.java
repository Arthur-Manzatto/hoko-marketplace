package com.hokomarketplace.hokoapi.repositories;

import com.hokomarketplace.hokoapi.entities.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    Page<Category> findBySlugContainingIgnoreCase(
            String slug,
            Pageable pageable
    );
}

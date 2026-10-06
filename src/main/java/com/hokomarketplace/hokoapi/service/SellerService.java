package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.repository.SellerRepository;
import com.hokomarketplace.hokoapi.service.exception.DatabaseException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SearchUtils;
import com.hokomarketplace.hokoapi.util.SlugUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SellerService {

    @Autowired
    private SellerRepository repository;

    @Autowired
    private UserService userService;

    @Transactional(readOnly = true)
    public Page<Seller> findAll(String search, boolean includeDeleted, Pageable pageable) {
        if (includeDeleted) {
            if (search != null && !search.isBlank()) {
                return repository.findByStoreNameSearchContaining(SearchUtils.normalize(search), pageable);
            }
            return repository.findAll(pageable);
        }
        if (search != null && !search.isBlank()) {
            return repository.findByStoreNameSearchContainingActive(SearchUtils.normalize(search), pageable);
        }
        return repository.findAllActive(pageable);
    }

    @Transactional(readOnly = true)
    public Seller get(UUID id, boolean includeDeleted) {
        if (includeDeleted) {
            return repository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + id));
        }
        return repository.findByIdActive(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Seller getByUserId(UUID userId, boolean includeDeleted) {
        if (includeDeleted) {
            return repository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Seller not found with user id: " + userId));
        }
        return repository.findByUserIdActive(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with user id: " + userId));
    }

    @Transactional(readOnly = true)
    public Seller getBySlug(String slug, boolean includeDeleted) {
        if (includeDeleted) {
            return repository.findBySlug(slug)
                    .orElseThrow(() -> new ResourceNotFoundException("Seller not found with slug: " + slug));
        }
        return repository.findBySlugActive(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with slug: " + slug));
    }

    @Transactional
    public Seller insert(UUID userId, SellerRequestDTO dto) {
        Seller entity = new Seller();
        entity.setUser(userService.get(userId, false));
        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create Seller: duplicate store name or document");
        }
    }

    @Transactional
    public Seller update(UUID userId, SellerRequestDTO dto) {
        Seller entity = getByUserId(userId, false);

        Seller candidate = new Seller();
        apply(candidate, dto);
        if (isSame(entity, candidate)) {
            return entity;
        }

        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to update seller: duplicate store name or document");
        }
    }

    @Transactional
    public void delete(UUID userId) {
        Seller entity = getByUserId(userId, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }

    private String generateUniqueSlug(String storeName, java.util.UUID excludeId) {
        String baseSlug = SlugUtils.slugify(storeName);
        String slug = baseSlug;
        int counter = 1;

        while (slugExists(slug, excludeId)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    private boolean slugExists(String slug, java.util.UUID excludeId) {
        return repository.findBySlug(slug)
                .filter(sel -> excludeId == null || !sel.getId().equals(excludeId))
                .isPresent();
    }

    private void apply(Seller entity, SellerRequestDTO dto) {
        entity.setStoreName(dto.storeName().trim());
        entity.setSlug(generateUniqueSlug(dto.storeName().trim(), entity.getId()));
        entity.setDocument(dto.document().trim());
    }

    private boolean isSame(Seller entity, Seller other) {
        return entity.getStoreName().equals(other.getStoreName())
                && entity.getDocument().equals(other.getDocument());
    }
}

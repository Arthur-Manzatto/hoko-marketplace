package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.repository.SellerRepository;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SearchUtils;
import com.hokomarketplace.hokoapi.util.SlugUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SellerService {

    private final SellerRepository repository;
    private final UserService userService;

    public SellerService(SellerRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

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
        String storeName = dto.storeName().trim();
        entity.setStoreName(storeName);
        entity.setSlug(slugFor(storeName, null));
        entity.setDocument(dto.document().trim());
        return repository.saveAndFlush(entity);
    }

    @Transactional
    public Seller update(UUID userId, SellerRequestDTO dto) {
        Seller entity = getByUserId(userId, false);
        String storeName = dto.storeName().trim();
        String document = dto.document().trim();

        boolean nameChanged = !entity.getStoreName().equals(storeName);
        if (!nameChanged && entity.getDocument().equals(document)) {
            return entity;
        }

        if (nameChanged) {
            entity.setStoreName(storeName);
            entity.setSlug(slugFor(storeName, entity.getId()));
        }
        entity.setDocument(document);
        return repository.saveAndFlush(entity);
    }

    @Transactional
    public void delete(UUID userId) {
        Seller entity = getByUserId(userId, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }

    private String slugFor(String name, UUID excludeId) {
        return SlugUtils.unique(name, slug -> repository.findBySlug(slug)
                .filter(sel -> excludeId == null || !sel.getId().equals(excludeId))
                .isPresent());
    }
}

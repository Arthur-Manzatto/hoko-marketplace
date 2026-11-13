package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.repository.SellerRepository;
import com.hokomarketplace.hokoapi.service.exception.BusinessException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.DocumentUtils;
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

    /**
     * Abre a loja do usuário. Como é uma loja por usuário (contando as apagadas),
     * quem fechou a loja e quer vender de novo tem a loja antiga reativada com os dados novos.
     * Loja ativa existente cai no UNIQUE (sellers_user_id_key) e vira 409.
     */
    @Transactional
    public Seller insert(UUID userId, SellerRequestDTO dto) {
        Seller entity = repository.findByUserId(userId)
                .filter(existing -> existing.getDeletedAt() != null)
                .orElseGet(Seller::new);
        User user = userService.get(userId, false); // 404 se o usuário não existe ou foi apagado
        if (entity.getId() == null) {
            entity.setUser(user);
        }
        String storeName = dto.storeName().trim();
        String document = validDocument(dto.document());
        entity.setStoreName(storeName);
        entity.setSlug(slugFor(storeName, entity.getId()));
        entity.setDocument(document);
        entity.setDeletedAt(null);
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
        // só valida o documento quando ele muda: lojas antigas com documento inválido ainda podem trocar o nome
        if (!entity.getDocument().equals(document)) {
            entity.setDocument(validDocument(document));
        }
        return repository.saveAndFlush(entity);
    }

    @Transactional
    public void delete(UUID userId) {
        Seller entity = getByUserId(userId, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }

    /** CPF/CNPJ com dígitos verificadores corretos, senão 422. */
    private static String validDocument(String raw) {
        String document = raw.trim();
        if (!DocumentUtils.isValid(document)) {
            throw new BusinessException("Invalid CPF or CNPJ");
        }
        return document;
    }

    private String slugFor(String name, UUID excludeId) {
        return SlugUtils.unique(name, slug -> repository.findBySlug(slug)
                .filter(sel -> excludeId == null || !sel.getId().equals(excludeId))
                .isPresent());
    }
}

package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.UserRequestDTO;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.repository.UserRepository;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SearchUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * Usuários nascem no signup do Supabase Auth (trigger handle_new_user) e o
 * e-mail é espelhado de auth.users. Por isso não há insert e o e-mail não é editável aqui.
 */
@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<User> findAll(String search, boolean includeDeleted, Pageable pageable) {
        if (includeDeleted) {
            if (search != null && !search.isBlank()) {
                return repository.findByNameSearchContaining(SearchUtils.normalize(search), pageable);
            }
            return repository.findAll(pageable);
        }
        if (search != null && !search.isBlank()) {
            return repository.findByNameSearchContainingActive(SearchUtils.normalize(search), pageable);
        }
        return repository.findAllActive(pageable);
    }

    @Transactional(readOnly = true)
    public User get(UUID id, boolean includeDeleted) {
        if (includeDeleted) {
            return repository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        }
        return repository.findByIdActive(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email, boolean includeDeleted) {
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (includeDeleted) {
            return repository.findByEmail(normalized)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        }
        return repository.findByEmailActive(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User update(UUID id, UserRequestDTO dto) {
        User entity = get(id, false);
        String name = dto.name().trim();
        String phone = dto.phone() == null || dto.phone().isBlank() ? null : dto.phone().trim();

        if (entity.getName().equals(name) && Objects.equals(entity.getPhone(), phone)) {
            return entity;
        }

        entity.setName(name);
        entity.setPhone(phone);
        return repository.saveAndFlush(entity);
    }

    /** Soft delete. O trigger trg_users_soft_delete propaga para endereços e loja. */
    @Transactional
    public void delete(UUID id) {
        User entity = get(id, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }
}

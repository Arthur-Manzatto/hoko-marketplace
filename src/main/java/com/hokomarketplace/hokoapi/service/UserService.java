package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.UserRequestDTO;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.repository.UserRepository;
import com.hokomarketplace.hokoapi.service.exception.DatabaseException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SearchUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

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
        if (includeDeleted) {
            return repository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        }
        return repository.findByEmailActive(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User insert(UserRequestDTO dto) {
        User entity = new User();
        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create user: duplicate email or phone number");
        }
    }

    @Transactional
    public User update(UUID id, UserRequestDTO dto) {
        User entity = get(id, false);

        User candidate = new User();
        apply(candidate, dto);
        if (isSame(entity, candidate)) {
            return entity;
        }

        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to update user: duplicate email or phone number");
        }
    }

    @Transactional
    public void delete(UUID id) {
        User entity = get(id, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }

    private void apply(User entity, UserRequestDTO dto) {
        entity.setName(dto.name().trim());
        entity.setEmail(dto.email().trim());
        entity.setPhone(dto.phone() == null ? null : dto.phone().trim());
    }

    private boolean isSame(User entity, User other) {
        return entity.getName().equals(other.getName())
                && entity.getEmail().equals(other.getEmail())
                && Objects.equals(entity.getPhone(), other.getPhone());
    }

}
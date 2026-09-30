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

import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    @Transactional(readOnly = true)
    public Page<User> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return repository.findByNameSearchContaining(SearchUtils.normalize(search), pageable);
        }
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return repository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User insert(UserRequestDTO dto) {
        User entity = new User();
        entity.setName(dto.name().trim());
        entity.setEmail(dto.email().trim());
        entity.setPhone(dto.phone().trim());
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create user: duplicate email or phone number");
        }
    }

    @Transactional
    public User update(UUID id, UserRequestDTO dto) {
        User entity = findById(id);
        String newName = dto.name().trim();
        String newEmail = dto.email().trim();
        String newPhone = dto.phone().trim();

        if (entity.getName().equals(newName) &&  entity.getEmail().equals(newEmail) && entity.getPhone().equals(newPhone)) {
            return entity;
        }

        entity.setName(newName);
        entity.setEmail(newEmail);
        entity.setPhone(newPhone);

        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to update user: duplicate email or phone number");
        }

    }

    @Transactional
    public void delete(UUID id) {
        User entity = findById(id);
        try {
            repository.delete(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Cannot delete user: it may be referenced by other entities");
        }
    }


}

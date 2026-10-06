package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.AddressRequestDTO;
import com.hokomarketplace.hokoapi.entity.Address;
import com.hokomarketplace.hokoapi.repository.AddressRepository;
import com.hokomarketplace.hokoapi.service.exception.DatabaseException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
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
public class AddressService {

    @Autowired
    private AddressRepository repository;

    @Autowired
    private UserService userService;

    @Transactional(readOnly = true)
    public Page<Address> findAll(UUID userId, boolean includeDeleted, Pageable pageable) {
        userService.get(userId, false);
        if (includeDeleted) {
            return repository.findByUserId(userId, pageable);
        }
        return repository.findByUserIdActive(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Address get(UUID userId, UUID id, boolean includeDeleted) {
        userService.get(userId, false);
        if (includeDeleted) {
            return repository.findByUserIdAndId(userId, id)
                    .orElseThrow(() -> new ResourceNotFoundException("Address not found with id " + id + " for user " + userId));
        }
        return repository.findByUserIdAndIdActive(userId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id " + id + " for user " + userId));
    }

    @Transactional
    public Address setDefault(UUID userId, UUID id) {
        Address entity = get(userId, id, false);
        repository.clearDefaultExcept(userId, id);
        entity.setDefault(true);
        return repository.save(entity);
    }

    @Transactional
    public Address insert(UUID userId, AddressRequestDTO dto) {
        Address entity = new Address();
        entity.setUser(userService.get(userId, false));
        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create address");
        }
    }

    @Transactional
    public Address update(UUID userId, UUID id, AddressRequestDTO dto) {
        Address entity = get(userId, id, false);

        Address candidate = new Address();
        apply(candidate, dto);
        if (isSame(entity, candidate)) {
            return entity;
        }

        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to update address");
        }
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Address entity = get(userId, id, false);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
    }

    private void apply(Address entity, AddressRequestDTO dto) {
        entity.setLabel(dto.label() == null ? null : dto.label().trim());
        entity.setStreet(dto.street().trim());
        entity.setNumber(dto.number().trim());
        entity.setComplement(dto.complement() == null ? null : dto.complement().trim());
        entity.setNeighborhood(dto.neighborhood().trim());
        entity.setCity(dto.city().trim());
        entity.setState(dto.state().trim().toUpperCase());
        entity.setZipCode(dto.zipCode().trim());
    }

    private boolean isSame(Address entity, Address other) {
        return Objects.equals(entity.getLabel(), other.getLabel())
                && entity.getStreet().equals(other.getStreet())
                && entity.getNumber().equals(other.getNumber())
                && Objects.equals(entity.getComplement(), other.getComplement())
                && entity.getNeighborhood().equals(other.getNeighborhood())
                && entity.getCity().equals(other.getCity())
                && entity.getState().equals(other.getState())
                && entity.getZipCode().equals(other.getZipCode());
    }
}

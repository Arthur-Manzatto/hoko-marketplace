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

import java.util.Objects;
import java.util.UUID;

@Service
public class AddressService {

    @Autowired
    private AddressRepository repository;

    @Autowired
    private UserService userService;

    @Transactional(readOnly = true)
    public Page<Address> findAllByUserId(UUID userId, Pageable pageable) {
        userService.findById(userId);
        return repository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Address findById(UUID userId,  UUID id) {
        return repository.findByUserIdAndId(userId, id).orElseThrow(() -> new ResourceNotFoundException("Address not found with id " + id + " for user " + userId));
    }

    @Transactional
    public Address insert(UUID userId, AddressRequestDTO dto) {
        Address entity = new Address();
        entity.setUser(userService.findById(userId));
        apply(entity, dto);
        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create address");
        }
    }

    @Transactional
    public Address update(UUID userId, UUID id, AddressRequestDTO dto) {
        Address entity = findById(userId, id);

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
        Address entity = findById(userId, id);
        try {
            repository.delete(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to delete address: it may be referenced by other entities");
        }
    }

    private void apply(Address entity, AddressRequestDTO dto) {
        entity.setStreet(dto.street().trim());
        entity.setNumber(dto.number().trim());
        entity.setComplement(dto.complement() == null ? null : dto.complement().trim());
        entity.setNeighborhood(dto.neighborhood().trim());
        entity.setCity(dto.city().trim());
        entity.setState(dto.state().trim().toUpperCase());
        entity.setZipCode(dto.zipCode().trim());
    }

    private boolean isSame(Address entity, Address other) {
        return entity.getStreet().equals(other.getStreet())
                && entity.getNumber().equals(other.getNumber())
                && Objects.equals(entity.getComplement(), other.getComplement())
                && entity.getNeighborhood().equals(other.getNeighborhood())
                && entity.getCity().equals(other.getCity())
                && entity.getState().equals(other.getState())
                && entity.getZipCode().equals(other.getZipCode());
    }


}

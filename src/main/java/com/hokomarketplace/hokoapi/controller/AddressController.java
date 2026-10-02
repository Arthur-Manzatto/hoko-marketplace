package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.AddressRequestDTO;
import com.hokomarketplace.hokoapi.dto.AddressResponseDTO;
import com.hokomarketplace.hokoapi.entity.Address;
import com.hokomarketplace.hokoapi.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/addresses")
public class AddressController {

    @Autowired
    private AddressService service;

    @GetMapping
    public ResponseEntity<Page<AddressResponseDTO>> findAll(@PathVariable UUID userId, Pageable pageable) {
        Page<AddressResponseDTO> page = service.findAllByUserId(userId, pageable).map(AddressResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping(value = "/{id}")
    public ResponseEntity<AddressResponseDTO> findById(@PathVariable UUID userId, @PathVariable UUID id) {
        Address obj = service.findById(userId, id);
        return ResponseEntity.ok(new AddressResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<AddressResponseDTO> insert(@PathVariable UUID userId, @Valid @RequestBody AddressRequestDTO dto) {
        Address obj = service.insert(userId, dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new AddressResponseDTO(obj));
    }

    @PutMapping(value = "/{id}")
    public ResponseEntity<AddressResponseDTO> update(@PathVariable UUID userId, @PathVariable UUID id, @Valid @RequestBody AddressRequestDTO dto) {
        Address obj = service.update(userId, id, dto);
        return  ResponseEntity.ok(new AddressResponseDTO(obj));
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<AddressResponseDTO> setDefault(
            @PathVariable UUID userId,
            @PathVariable UUID id
    ) {
        Address obj = service.setDefault(userId, id);
        return ResponseEntity.ok(new AddressResponseDTO(obj));
    }
}

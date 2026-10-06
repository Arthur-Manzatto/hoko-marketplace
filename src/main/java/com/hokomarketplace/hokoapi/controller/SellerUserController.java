package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.dto.SellerResponseDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/seller")
public class SellerUserController {

    @Autowired
    private SellerService service;

    @GetMapping
    public ResponseEntity<SellerResponseDTO> findByUserId(
            @PathVariable UUID userId,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Seller obj = service.getByUserId(userId, includeDeleted);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<SellerResponseDTO> insert(
            @PathVariable UUID userId,
            @Valid @RequestBody SellerRequestDTO dto) {

        Seller obj = service.insert(userId, dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new SellerResponseDTO(obj));
    }

    @PutMapping
    public ResponseEntity<SellerResponseDTO> update(
            @PathVariable UUID userId,
            @Valid @RequestBody SellerRequestDTO dto) {

        Seller obj = service.update(userId, dto);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable UUID userId) {
        service.delete(userId);
        return ResponseEntity.noContent().build();
    }
}
package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.ProductRequestDTO;
import com.hokomarketplace.hokoapi.dto.ProductResponseDTO;
import com.hokomarketplace.hokoapi.dto.ProductStockDTO;
import com.hokomarketplace.hokoapi.dto.ProductSummaryDTO;
import com.hokomarketplace.hokoapi.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/seller/products")
public class SellerProductController {

    private final ProductService service;

    public SellerProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDTO>> findMine(
            @PathVariable UUID userId,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        return ResponseEntity.ok(service.findMine(userId, includeDeleted, pageable));
    }

    @PostMapping
    public ResponseEntity<ProductResponseDTO> insert(
            @PathVariable UUID userId,
            @Valid @RequestBody ProductRequestDTO dto) {

        ProductResponseDTO obj = service.insert(userId, dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(obj.id()).toUri();
        return ResponseEntity.created(uri).body(obj);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> update(
            @PathVariable UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequestDTO dto) {

        return ResponseEntity.ok(service.update(userId, id, dto));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductResponseDTO> updateStock(
            @PathVariable UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody ProductStockDTO dto) {

        return ResponseEntity.ok(service.updateStock(userId, id, dto.quantity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
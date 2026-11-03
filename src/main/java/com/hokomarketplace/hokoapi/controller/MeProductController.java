package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.ProductRequestDTO;
import com.hokomarketplace.hokoapi.dto.ProductResponseDTO;
import com.hokomarketplace.hokoapi.dto.ProductStockDTO;
import com.hokomarketplace.hokoapi.dto.ProductSummaryDTO;
import com.hokomarketplace.hokoapi.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

/** Produtos da loja do usuário logado. O ProductService garante que só mexe nos da própria loja. */
@RestController
@RequestMapping("/api/me/seller/products")
public class MeProductController {

    private final ProductService service;

    public MeProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDTO>> findMine(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        return ResponseEntity.ok(service.findMine(CurrentUser.id(jwt), includeDeleted, pageable));
    }

    @PostMapping
    public ResponseEntity<ProductResponseDTO> insert(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProductRequestDTO dto) {

        ProductResponseDTO obj = service.insert(CurrentUser.id(jwt), dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/products/{id}").buildAndExpand(obj.id()).toUri();
        return ResponseEntity.created(uri).body(obj);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequestDTO dto) {

        return ResponseEntity.ok(service.update(CurrentUser.id(jwt), id, dto));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductResponseDTO> updateStock(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody ProductStockDTO dto) {

        return ResponseEntity.ok(service.updateStock(CurrentUser.id(jwt), id, dto.quantity()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(CurrentUser.id(jwt), id);
        return ResponseEntity.noContent().build();
    }
}

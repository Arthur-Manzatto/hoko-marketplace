package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.SellerPublicResponseDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.service.SellerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sellers")
public class SellerController {

    private final SellerService service;

    public SellerController(SellerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<SellerPublicResponseDTO>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        Page<SellerPublicResponseDTO> page = service.findAll(search, includeDeleted, pageable)
                .map(SellerPublicResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerPublicResponseDTO> findById(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Seller obj = service.get(id, includeDeleted);
        return ResponseEntity.ok(new SellerPublicResponseDTO(obj));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<SellerPublicResponseDTO> findBySlug(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Seller obj = service.getBySlug(slug, includeDeleted);
        return ResponseEntity.ok(new SellerPublicResponseDTO(obj));
    }
}
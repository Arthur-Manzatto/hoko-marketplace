package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.SellerResponseDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sellers")
public class SellerController {

    @Autowired
    private SellerService service;

    @GetMapping
    public ResponseEntity<Page<SellerResponseDTO>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        Page<SellerResponseDTO> page = service.findAll(search, includeDeleted, pageable)
                .map(SellerResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerResponseDTO> findById(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Seller obj = service.get(id, includeDeleted);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<SellerResponseDTO> findBySlug(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Seller obj = service.getBySlug(slug, includeDeleted);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }
}
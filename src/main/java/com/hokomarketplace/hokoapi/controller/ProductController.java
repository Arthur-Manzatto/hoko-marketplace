package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.ProductResponseDTO;
import com.hokomarketplace.hokoapi.dto.ProductSummaryDTO;
import com.hokomarketplace.hokoapi.dto.filters.ProductFilter;
import com.hokomarketplace.hokoapi.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDTO>> findAll(
            @ModelAttribute ProductFilter filter,
            Pageable pageable) {

        return ResponseEntity.ok(service.search(filter, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProductResponseDTO> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(service.getBySlug(slug));
    }

}

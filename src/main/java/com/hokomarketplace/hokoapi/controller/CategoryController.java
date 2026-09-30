package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.CategoryRequestDTO;
import com.hokomarketplace.hokoapi.dto.CategoryResponseDTO;
import com.hokomarketplace.hokoapi.entity.Category;
import com.hokomarketplace.hokoapi.service.CategoryService;
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
@RequestMapping(value = "/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService service;

    @GetMapping
    public ResponseEntity<Page<CategoryResponseDTO>> findAll(@RequestParam(required = false) String search, Pageable pageable) {
        Page<CategoryResponseDTO> page = service.findAll(search, pageable).map(CategoryResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> findById(@PathVariable UUID id) {
        Category obj = service.findById(id);
        return ResponseEntity.ok(new CategoryResponseDTO(obj));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoryResponseDTO> findBySlug(@PathVariable String slug) {
        Category obj = service.findBySlug(slug);
        return ResponseEntity.ok(new CategoryResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> insert(@Valid @RequestBody CategoryRequestDTO dto) {
        Category obj = service.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new CategoryResponseDTO(obj));
    }

    @PutMapping(value = "/{id}")
    public ResponseEntity<CategoryResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody CategoryRequestDTO dto) {
        Category obj = service.update(id, dto);
        return ResponseEntity.ok(new CategoryResponseDTO(obj));
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }




}

package com.hokomarketplace.hokoapi.resources;

import com.hokomarketplace.hokoapi.dto.CategoryRequestDTO;
import com.hokomarketplace.hokoapi.dto.CategoryResponseDTO;
import com.hokomarketplace.hokoapi.entities.Category;
import com.hokomarketplace.hokoapi.services.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping(value = "/api/categories")
public class CategoryResource {

    @Autowired
    private CategoryService service;

    @GetMapping
    public ResponseEntity<Page<CategoryResponseDTO>> findAll(@RequestParam(required = false) String search, Pageable pageable) {
        Page<CategoryResponseDTO> page = service.findAll(search, pageable).map(CategoryResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CategoryResponseDTO> findBySlug(@PathVariable String slug) {
        Category obj = service.findBySlug(slug);
        return ResponseEntity.ok(new CategoryResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> insert(@Valid @RequestBody CategoryRequestDTO dto) {
        Category category = service.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{slug}").buildAndExpand(category.getSlug()).toUri();
        return ResponseEntity.created(uri).body(new CategoryResponseDTO(category));
    }

    @PutMapping(value = "/{slug}")
    public ResponseEntity<CategoryResponseDTO> update(@PathVariable String slug, @Valid @RequestBody CategoryRequestDTO dto) {
        Category category = service.update(slug, dto);
        return ResponseEntity.ok(new CategoryResponseDTO(category));
    }

    @DeleteMapping(value = "/{slug}")
    public ResponseEntity<Void> delete(@PathVariable String slug) {
        service.delete(slug);
        return ResponseEntity.noContent().build();
    }




}

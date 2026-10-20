package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CategoryRequestDTO;
import com.hokomarketplace.hokoapi.entity.Category;
import com.hokomarketplace.hokoapi.repository.CategoryRepository;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SlugUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<Category> findAll(String search, Pageable pageable){
        if (search != null && !search.isBlank()) {
            String slug = SlugUtils.slugify(search);
            return repository.findBySlugContainingIgnoreCase(slug, pageable);
        }
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Category findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }

    @Transactional(readOnly = true)
    public Category findBySlug(String slug){
        return repository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
    }

    @Transactional
    public Category insert(CategoryRequestDTO dto) {
        Category entity = new Category();
        entity.setName(dto.name().trim());
        entity.setSlug(slugFor(dto.name().trim(), null));
        entity.setIcon(dto.icon().trim());
        return repository.saveAndFlush(entity);
    }

    @Transactional
    public Category update(UUID id, CategoryRequestDTO dto) {
        Category entity = findById(id);
        String newName = dto.name().trim();
        String newIcon = dto.icon().trim();

        if (entity.getName().equals(newName) && entity.getIcon().equals(newIcon)) {
            return entity;
        }
        if (!entity.getName().equals(newName)) {
            entity.setName(newName);
            entity.setSlug(slugFor(newName, entity.getId()));
        }
        entity.setIcon(newIcon);
        return repository.saveAndFlush(entity);
    }

    /** Categoria com produto vinculado é barrada pela FK (ON DELETE RESTRICT) e vira 409. */
    @Transactional
    public void delete(UUID id) {
        Category entity = findById(id);
        repository.delete(entity);
        repository.flush();
    }

    private String slugFor(String name, UUID excludeId) {
        return SlugUtils.unique(name, slug -> repository.findBySlug(slug)
                .filter(cat -> excludeId == null || !cat.getId().equals(excludeId))
                .isPresent());
    }

}

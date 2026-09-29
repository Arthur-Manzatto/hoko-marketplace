package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CategoryRequestDTO;
import com.hokomarketplace.hokoapi.entity.Category;
import com.hokomarketplace.hokoapi.repository.CategoryRepository;
import com.hokomarketplace.hokoapi.service.exception.DatabaseException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SlugUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repository;

    @Transactional(readOnly = true)
    public Category findBySlug(String slug){
        return repository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException(slug));
    }

    @Transactional(readOnly = true)
    public Page<Category> findAll(String search, Pageable pageable){
        if (search != null && !search.isBlank()) {
            String slug = SlugUtils.slugify(search);
            return repository.findBySlugContainingIgnoreCase(slug, pageable);
        }
        return repository.findAll(pageable);
    }

    @Transactional
    public Category insert(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.name().trim());
        category.setSlug(generateUniqueSlug(dto.name().trim()));
        try {
            return repository.save(category);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to create category: duplicate name or slug");
        }
    }

    @Transactional
    public Category update(String slug, CategoryRequestDTO dto) {
        Category entity = findBySlug(slug);
        String newName = dto.name().trim();

        if (entity.getName().equals(newName)) {
            return entity;
        }
        entity.setName(newName);
        entity.setSlug(generateUniqueSlug(newName, entity.getId()));

        try {
            return repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Failed to update category: duplicate name or slug");
        }
    }

    @Transactional
    public void delete(String slug) {
        Category category = findBySlug(slug);
        try {
            repository.delete(category);
        } catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Cannot delete category: it may be referenced by other entities");
        }
    }

    private String generateUniqueSlug(String name) {
        return generateUniqueSlug(name, null);
    }

    private String generateUniqueSlug(String name, java.util.UUID excludeId) {
        String baseSlug = SlugUtils.slugify(name);
        String slug = baseSlug;
        int counter = 1;

        while (slugExists(slug, excludeId)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    private boolean slugExists(String slug, java.util.UUID excludeId) {
        return repository.findBySlug(slug)
                .filter(cat -> excludeId == null || !cat.getId().equals(excludeId))
                .isPresent();
    }

}

package com.hokomarketplace.hokoapi.services;

import com.hokomarketplace.hokoapi.entities.Category;
import com.hokomarketplace.hokoapi.repositories.CategoryRepository;
import com.hokomarketplace.hokoapi.services.exceptions.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.utils.SlugUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {

    @Autowired
    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    public Category findBySlug(String slug){
        return repository.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException(slug));
    }

    public Page<Category> find(String search, Pageable pageable){
        if (search == null || search.isBlank()) {
            return repository.findAll(pageable);
        }
        String slug = SlugUtils.slugify(search);
        return repository.findBySlugContainingIgnoreCase(slug, pageable);
    }

    public Category insert(Category obj) {
        obj.setSlug(SlugUtils.slugify(obj.getName()));
        return repository.save(obj);
    }

    public void deleteBySlug(String slug) {
        Category category = repository.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException(slug));
        repository.delete(category);
    }

    public Category updateBySlug(String slug, Category obj) {
        Category entity = repository.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException(slug));
        updateData(entity, obj);
        return repository.save(entity);
    }

    private void updateData(Category entity, Category obj) {
        entity.setName(obj.getName());
    }

}

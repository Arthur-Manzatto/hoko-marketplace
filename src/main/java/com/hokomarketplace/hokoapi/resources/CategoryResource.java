package com.hokomarketplace.hokoapi.resources;

import com.hokomarketplace.hokoapi.entities.Category;
import com.hokomarketplace.hokoapi.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/categories")
public class CategoryResource {

    @Autowired
    private CategoryService service;

    @GetMapping
    public ResponseEntity<List<Category>> findAll() {
        List<Category> list = service.findAll();
        return ResponseEntity.ok().body( list);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Category> findBySlug(@PathVariable String slug) {
        Category obj = service.findBySlug(slug);
        return ResponseEntity.ok().body(obj);
    }

    @PostMapping
    public ResponseEntity<Category> insert(@RequestBody Category obj) {
        obj = service.insert(obj);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{slug}").buildAndExpand(obj.getSlug()).toUri();
        return ResponseEntity.created(uri).body(obj);
    }

    @DeleteMapping(value = "/{slug}")
    public ResponseEntity<Void> deleteBySlug(@PathVariable String slug) {
        service.deleteBySlug(slug);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{slug}")
    public ResponseEntity<Category> updateBySlug(@PathVariable String slug, @RequestBody Category obj) {
        obj = service.updateBySlug(slug, obj);
        return ResponseEntity.ok().body(obj);
    }


}

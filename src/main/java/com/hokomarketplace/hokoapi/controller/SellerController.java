package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.SellerPublicResponseDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.service.SellerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            Pageable pageable,
            Authentication authentication) {

        Page<SellerPublicResponseDTO> page = service.findAll(search, adminOnly(includeDeleted, authentication), pageable)
                .map(SellerPublicResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerPublicResponseDTO> findById(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Authentication authentication) {

        Seller obj = service.get(id, adminOnly(includeDeleted, authentication));
        return ResponseEntity.ok(new SellerPublicResponseDTO(obj));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<SellerPublicResponseDTO> findBySlug(
            @PathVariable String slug,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Authentication authentication) {

        Seller obj = service.getBySlug(slug, adminOnly(includeDeleted, authentication));
        return ResponseEntity.ok(new SellerPublicResponseDTO(obj));
    }

    /** Lojas apagadas só aparecem para admin; para os outros o parâmetro é ignorado. */
    private static boolean adminOnly(boolean includeDeleted, Authentication authentication) {
        return includeDeleted && CurrentUser.isAdmin(authentication);
    }
}
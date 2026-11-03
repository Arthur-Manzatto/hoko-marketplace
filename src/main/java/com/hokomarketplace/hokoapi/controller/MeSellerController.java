package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.dto.SellerResponseDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.service.SellerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/** Loja do usuário logado (virar vendedor, editar, fechar). */
@RestController
@RequestMapping("/api/me/seller")
public class MeSellerController {

    private final SellerService service;

    public MeSellerController(SellerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<SellerResponseDTO> get(@AuthenticationPrincipal Jwt jwt) {
        Seller obj = service.getByUserId(CurrentUser.id(jwt), false);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<SellerResponseDTO> insert(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SellerRequestDTO dto) {

        Seller obj = service.insert(CurrentUser.id(jwt), dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/sellers/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new SellerResponseDTO(obj));
    }

    @PutMapping
    public ResponseEntity<SellerResponseDTO> update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SellerRequestDTO dto) {

        Seller obj = service.update(CurrentUser.id(jwt), dto);
        return ResponseEntity.ok(new SellerResponseDTO(obj));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt) {
        service.delete(CurrentUser.id(jwt));
        return ResponseEntity.noContent().build();
    }
}

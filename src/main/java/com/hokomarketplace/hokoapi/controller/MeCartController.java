package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.CartItemRequestDTO;
import com.hokomarketplace.hokoapi.dto.CartQuantityDTO;
import com.hokomarketplace.hokoapi.dto.CartResponseDTO;
import com.hokomarketplace.hokoapi.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Carrinho do usuário logado. Toda alteração devolve o carrinho inteiro atualizado. */
@RestController
@RequestMapping("/api/me/cart")
public class MeCartController {

    private final CartService service;

    public MeCartController(CartService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<CartResponseDTO> get(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.get(CurrentUser.id(jwt)));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponseDTO> add(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CartItemRequestDTO dto) {

        return ResponseEntity.ok(service.add(CurrentUser.id(jwt), dto));
    }

    @PatchMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> updateQuantity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID itemId,
            @Valid @RequestBody CartQuantityDTO dto) {

        return ResponseEntity.ok(service.updateQuantity(CurrentUser.id(jwt), itemId, dto.quantity()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponseDTO> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID itemId) {
        return ResponseEntity.ok(service.remove(CurrentUser.id(jwt), itemId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@AuthenticationPrincipal Jwt jwt) {
        service.clear(CurrentUser.id(jwt));
        return ResponseEntity.noContent().build();
    }
}

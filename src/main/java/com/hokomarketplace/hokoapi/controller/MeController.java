package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.MeResponseDTO;
import com.hokomarketplace.hokoapi.dto.UserRequestDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.service.SellerService;
import com.hokomarketplace.hokoapi.service.UserService;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Perfil do usuário logado. O id vem sempre do token, nunca da URL. */
@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserService userService;
    private final SellerService sellerService;

    public MeController(UserService userService, SellerService sellerService) {
        this.userService = userService;
        this.sellerService = sellerService;
    }

    @GetMapping
    public ResponseEntity<MeResponseDTO> me(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        UUID id = CurrentUser.id(jwt);
        User user = userService.get(id, false);
        return ResponseEntity.ok(new MeResponseDTO(user, sellerOrNull(id), CurrentUser.isAdmin(authentication)));
    }

    @PutMapping
    public ResponseEntity<MeResponseDTO> update(
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication,
            @Valid @RequestBody UserRequestDTO dto) {

        UUID id = CurrentUser.id(jwt);
        User user = userService.update(id, dto);
        return ResponseEntity.ok(new MeResponseDTO(user, sellerOrNull(id), CurrentUser.isAdmin(authentication)));
    }

    private Seller sellerOrNull(UUID userId) {
        try {
            return sellerService.getByUserId(userId, false);
        } catch (ResourceNotFoundException e) {
            return null; // ainda não é vendedor
        }
    }
}

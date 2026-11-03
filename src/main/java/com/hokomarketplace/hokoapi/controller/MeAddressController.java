package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.AddressRequestDTO;
import com.hokomarketplace.hokoapi.dto.AddressResponseDTO;
import com.hokomarketplace.hokoapi.entity.Address;
import com.hokomarketplace.hokoapi.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

/** Endereços do usuário logado. */
@RestController
@RequestMapping("/api/me/addresses")
public class MeAddressController {

    private final AddressService service;

    public MeAddressController(AddressService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<AddressResponseDTO>> findAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        Page<AddressResponseDTO> page = service.findAll(CurrentUser.id(jwt), includeDeleted, pageable)
                .map(AddressResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressResponseDTO> findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        Address obj = service.get(CurrentUser.id(jwt), id, includeDeleted);
        return ResponseEntity.ok(new AddressResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<AddressResponseDTO> insert(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AddressRequestDTO dto) {

        Address obj = service.insert(CurrentUser.id(jwt), dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new AddressResponseDTO(obj));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressResponseDTO> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody AddressRequestDTO dto) {

        Address obj = service.update(CurrentUser.id(jwt), id, dto);
        return ResponseEntity.ok(new AddressResponseDTO(obj));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<AddressResponseDTO> setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        Address obj = service.setDefault(CurrentUser.id(jwt), id);
        return ResponseEntity.ok(new AddressResponseDTO(obj));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(CurrentUser.id(jwt), id);
        return ResponseEntity.noContent().build();
    }
}

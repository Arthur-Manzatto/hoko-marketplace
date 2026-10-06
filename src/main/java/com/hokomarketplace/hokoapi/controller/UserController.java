package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.dto.UserRequestDTO;
import com.hokomarketplace.hokoapi.dto.UserResponseDTO;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    @GetMapping
    public ResponseEntity<Page<UserResponseDTO>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted,
            Pageable pageable) {

        Page<UserResponseDTO> page = service.findAll(search, includeDeleted, pageable)
                .map(UserResponseDTO::new);
        return ResponseEntity.ok(page);
    }

    @GetMapping(value = "/{id}")
    public ResponseEntity<UserResponseDTO> findById(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        User obj = service.get(id, includeDeleted);
        return ResponseEntity.ok(new UserResponseDTO(obj));
    }

    @GetMapping(value = "/email/{email}")
    public ResponseEntity<UserResponseDTO> findByEmail(
            @PathVariable String email,
            @RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {

        User obj = service.getByEmail(email, includeDeleted);
        return ResponseEntity.ok(new UserResponseDTO(obj));
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> insert(@Valid @RequestBody UserRequestDTO dto) {
        User obj = service.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(obj.getId()).toUri();
        return ResponseEntity.created(uri).body(new UserResponseDTO(obj));
    }

    @PutMapping(value = "/{id}")
    public ResponseEntity<UserResponseDTO> update(@PathVariable UUID id, @Valid @RequestBody UserRequestDTO dto) {
        User obj = service.update(id, dto);
        return ResponseEntity.ok(new UserResponseDTO(obj));
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

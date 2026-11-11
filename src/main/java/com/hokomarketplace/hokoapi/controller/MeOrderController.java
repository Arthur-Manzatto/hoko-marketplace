package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.CheckoutRequestDTO;
import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.dto.OrderSummaryDTO;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Pedidos do usuário logado (comprador). */
@RestController
@RequestMapping("/api/me/orders")
public class MeOrderController {

    private final OrderService service;

    public MeOrderController(OrderService service) {
        this.service = service;
    }

    /** Fecha o carrinho: um pedido por loja. */
    @PostMapping("/checkout")
    public ResponseEntity<List<OrderResponseDTO>> checkout(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CheckoutRequestDTO dto) {

        return ResponseEntity.status(HttpStatus.CREATED).body(service.checkout(CurrentUser.id(jwt), dto));
    }

    @GetMapping
    public ResponseEntity<Page<OrderSummaryDTO>> findMine(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(service.findMine(CurrentUser.id(jwt), status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.get(CurrentUser.id(jwt), id));
    }

    /** Pagamento simulado. */
    @PostMapping("/{id}/pay")
    public ResponseEntity<OrderResponseDTO> pay(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.pay(CurrentUser.id(jwt), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDTO> cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(CurrentUser.id(jwt), id));
    }
}

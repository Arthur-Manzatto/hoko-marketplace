package com.hokomarketplace.hokoapi.controller;

import com.hokomarketplace.hokoapi.config.CurrentUser;
import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.dto.SalesSummaryDTO;
import com.hokomarketplace.hokoapi.dto.SellerOrderSummaryDTO;
import com.hokomarketplace.hokoapi.dto.ShipOrderDTO;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.service.SellerOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Vendas da loja do usuário logado. */
@RestController
@RequestMapping("/api/me/seller/orders")
public class MeSellerOrderController {

    private final SellerOrderService service;

    public MeSellerOrderController(SellerOrderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<SellerOrderSummaryDTO>> findMine(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(service.findMine(CurrentUser.id(jwt), status, pageable));
    }

    @GetMapping("/summary")
    public ResponseEntity<SalesSummaryDTO> summary(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.summary(CurrentUser.id(jwt)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> findById(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.get(CurrentUser.id(jwt), id));
    }

    @PostMapping("/{id}/ship")
    public ResponseEntity<OrderResponseDTO> ship(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) ShipOrderDTO dto) {

        return ResponseEntity.ok(service.ship(CurrentUser.id(jwt), id, dto));
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<OrderResponseDTO> deliver(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.deliver(CurrentUser.id(jwt), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDTO> cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(CurrentUser.id(jwt), id));
    }
}

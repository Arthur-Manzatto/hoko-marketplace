package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * Body opcional do "marcar como enviado". Rastreio dos Correios (AA123456789BR) ou de transportadora.
 */
public record ShipOrderDTO(
        @Size(max = 40)
        @Pattern(message = "Tracking code must contain only letters, digits and hyphens", regexp = "^[A-Za-z0-9-]*$")
        String trackingCode
) implements Serializable { }

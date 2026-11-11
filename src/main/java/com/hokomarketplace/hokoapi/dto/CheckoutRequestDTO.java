package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.UUID;

/**
 * Fecha o carrinho. installments é opcional (1 se vier vazio) e só pode ser > 1 no CARD.
 */
public record CheckoutRequestDTO(
        @NotNull
        UUID addressId,

        @NotNull
        PaymentMethod paymentMethod,

        @Min(1)
        @Max(12)
        Integer installments
) implements Serializable {

    public int installmentsOrDefault() {
        return installments == null ? 1 : installments;
    }
}

package com.hokomarketplace.hokoapi.dto;

import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestDTOValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void sellerAcceptsCpfAndCnpj() {
        assertTrue(validator.validate(new SellerRequestDTO("Minha Loja", "12345678901")).isEmpty());
        assertTrue(validator.validate(new SellerRequestDTO("Minha Loja", "12345678000199")).isEmpty());
    }

    @Test
    void sellerRejectsInvalidDocument() {
        assertEquals(1, validator.validate(new SellerRequestDTO("Minha Loja", "123.456.789-01")).size());
        assertEquals(1, validator.validate(new SellerRequestDTO("Minha Loja", "123456789012")).size());
    }

    @Test
    void sellerRejectsStoreNameLongerThanColumn() {
        assertEquals(1, validator.validate(new SellerRequestDTO("x".repeat(81), "12345678901")).size());
    }

    @Test
    void userPhoneIsOptionalButMustBeDigits() {
        assertTrue(validator.validate(new UserRequestDTO("Maria", null)).isEmpty());
        assertTrue(validator.validate(new UserRequestDTO("Maria", "19991234567")).isEmpty());
        assertEquals(1, validator.validate(new UserRequestDTO("Maria", "(19) 99123-4567")).size());
    }

    @Test
    void addressMatchesDatabaseChecks() {
        assertTrue(validator.validate(address("sp", "13010-000")).isEmpty());
        assertTrue(validator.validate(address("SP", "13010000")).isEmpty());
        assertEquals(1, validator.validate(address("S1", "13010000")).size());
        assertEquals(1, validator.validate(address("SP", "1301-0000")).size());
    }

    @Test
    void cartQuantityMustBeBetween1And99() {
        UUID productId = UUID.randomUUID();
        assertTrue(validator.validate(new CartItemRequestDTO(productId, 1)).isEmpty());
        assertTrue(validator.validate(new CartItemRequestDTO(productId, 99)).isEmpty());
        assertEquals(1, validator.validate(new CartItemRequestDTO(productId, 0)).size());
        assertEquals(1, validator.validate(new CartItemRequestDTO(productId, 100)).size());
        assertEquals(1, validator.validate(new CartItemRequestDTO(null, 1)).size());
        assertEquals(1, validator.validate(new CartQuantityDTO(0)).size());
    }

    @Test
    void checkoutNeedsAddressAndMethodAndUpTo12Installments() {
        UUID addressId = UUID.randomUUID();
        assertTrue(validator.validate(new CheckoutRequestDTO(addressId, PaymentMethod.PIX, null)).isEmpty());
        assertTrue(validator.validate(new CheckoutRequestDTO(addressId, PaymentMethod.CARD, 12)).isEmpty());
        assertEquals(1, validator.validate(new CheckoutRequestDTO(addressId, PaymentMethod.CARD, 13)).size());
        assertEquals(1, validator.validate(new CheckoutRequestDTO(null, PaymentMethod.PIX, null)).size());
        assertEquals(1, validator.validate(new CheckoutRequestDTO(addressId, null, null)).size());
    }

    @Test
    void trackingCodeIsOptionalAlphanumeric() {
        assertTrue(validator.validate(new ShipOrderDTO(null)).isEmpty());
        assertTrue(validator.validate(new ShipOrderDTO("AA123456789BR")).isEmpty());
        assertEquals(1, validator.validate(new ShipOrderDTO("AA 123")).size());
        assertEquals(1, validator.validate(new ShipOrderDTO("A".repeat(41))).size());
    }

    private static AddressRequestDTO address(String state, String zip) {
        return new AddressRequestDTO("Casa", "Rua X", "1", null, "Centro", "Campinas", state, zip);
    }
}

package com.hokomarketplace.hokoapi.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

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

    private static AddressRequestDTO address(String state, String zip) {
        return new AddressRequestDTO("Casa", "Rua X", "1", null, "Centro", "Campinas", state, zip);
    }
}

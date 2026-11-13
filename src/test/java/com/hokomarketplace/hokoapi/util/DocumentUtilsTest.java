package com.hokomarketplace.hokoapi.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentUtilsTest {

    @Test
    void acceptsValidCpfAndCnpj() {
        assertTrue(DocumentUtils.isValid("52998224725"));
        assertTrue(DocumentUtils.isValid("11144477735"));
        assertTrue(DocumentUtils.isValid("11222333000181"));
        assertTrue(DocumentUtils.isValid("45723174000110"));
    }

    @Test
    void rejectsWrongCheckDigits() {
        assertFalse(DocumentUtils.isValid("52998224724"));
        assertFalse(DocumentUtils.isValid("12345678901"));
        assertFalse(DocumentUtils.isValid("11222333000180"));
        assertFalse(DocumentUtils.isValid("12345678000199"));
    }

    @Test
    void rejectsRepeatedDigitsAndWrongFormats() {
        assertFalse(DocumentUtils.isValid("00000000000"));
        assertFalse(DocumentUtils.isValid("11111111111111"));
        assertFalse(DocumentUtils.isValid("529.982.247-25"));
        assertFalse(DocumentUtils.isValid("5299822472"));
        assertFalse(DocumentUtils.isValid(null));
    }
}

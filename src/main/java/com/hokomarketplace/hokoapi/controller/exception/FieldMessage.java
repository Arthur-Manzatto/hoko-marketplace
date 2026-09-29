package com.hokomarketplace.hokoapi.controller.exception;

public record FieldMessage(
        String fieldName,
        String message
) {}
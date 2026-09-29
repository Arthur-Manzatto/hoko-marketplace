package com.hokomarketplace.hokoapi.resources.exceptions;

public record FieldMessage(
        String fieldName,
        String message
) {}
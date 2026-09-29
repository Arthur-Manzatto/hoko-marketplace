package com.hokomarketplace.hokoapi.service.exception;

public class ResourceNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(Object identifier) {
        super("Resource not found: " + identifier);
    }
}

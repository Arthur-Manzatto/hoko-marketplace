package com.hokomarketplace.hokoapi.service.exception;

/** Regra de negócio violada (ex.: sem estoque). Vira 422 no ResourceExceptionHandler. */
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public BusinessException(String message) {
        super(message);
    }
}

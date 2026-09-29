package com.hokomarketplace.hokoapi.controller.exception;

import com.hokomarketplace.hokoapi.service.exception.DatabaseException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import java.time.Instant;

@RestControllerAdvice
public class ResourceExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ResourceExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<StandardError> resourceNotFound(
            ResourceNotFoundException e,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Resource not found",
                e.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(DatabaseException.class)
    public ResponseEntity<StandardError> database(
            DatabaseException e,
            HttpServletRequest request
    ) {
        HttpStatus status = e.getMessage().contains("duplicate")
                ? HttpStatus.CONFLICT
                : HttpStatus.BAD_REQUEST;
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Database error",
                e.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<StandardError> dataIntegrityViolation(
            DataIntegrityViolationException e,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.CONFLICT;
        String message = "Data integrity violation";
        if (e.getMessage().contains("categories_name_key")) {
            message = "A category with this name already exists";
        } else if (e.getMessage().contains("categories_slug_key")) {
            message = "A category with this slug already exists";
        }
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Conflict",
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationError> constraintViolation(
            ConstraintViolationException e,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        ValidationError error = new ValidationError(
                Instant.now(),
                status.value(),
                "Validation error",
                "Invalid input data",
                request.getRequestURI()
        );
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            error.addError(fieldName, violation.getMessage());
        }
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationError> validation(
            MethodArgumentNotValidException e,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        ValidationError error = new ValidationError(
                Instant.now(),
                status.value(),
                "Validation error",
                "Invalid input data",
                request.getRequestURI()
        );
        for (FieldError f : e.getBindingResult().getFieldErrors()) {
            error.addError(f.getField(), f.getDefaultMessage());
        }
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<StandardError> global(
            Exception e,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        logger.error("Unexpected error occurred at {}: {}",
                request.getRequestURI(),
                e.getMessage(),
                e);
        StandardError error = new StandardError(
                Instant.now(),
                status.value(),
                "Internal server error",
                "An unexpected error occurred",
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }

}
package com.hokomarketplace.hokoapi.repository;

import com.hokomarketplace.hokoapi.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

public final class ProductSpecs {

    private ProductSpecs() {}

    public static Specification<Product> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<Product> nameContains(String normalized) {
        return (root, query, cb) -> cb.like(root.get("nameSearch"), "%" + normalized + "%");
    }

    public static Specification<Product> hasCategory(UUID categoryId) {
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> hasCategorySlug(String slug) {
        return (root, query, cb) -> cb.equal(root.get("category").get("slug"), slug);
    }

    public static Specification<Product> hasSeller(UUID sellerId) {
        return (root, query, cb) -> cb.equal(root.get("seller").get("id"), sellerId);
    }

    public static Specification<Product> priceGte(BigDecimal min) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), min);
    }

    public static Specification<Product> priceLte(BigDecimal max) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), max);
    }

    public static Specification<Product> inStock() {
        return (root, query, cb) -> cb.greaterThan(root.get("quantity"), 0);
    }
}
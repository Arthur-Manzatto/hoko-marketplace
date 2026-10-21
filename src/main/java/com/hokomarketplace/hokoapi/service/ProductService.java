package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.ProductRequestDTO;
import com.hokomarketplace.hokoapi.dto.ProductResponseDTO;
import com.hokomarketplace.hokoapi.dto.ProductSummaryDTO;
import com.hokomarketplace.hokoapi.dto.filters.ProductFilter;
import com.hokomarketplace.hokoapi.entity.Category;
import com.hokomarketplace.hokoapi.entity.Product;
import com.hokomarketplace.hokoapi.entity.ProductImage;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.repository.ProductRepository;
import com.hokomarketplace.hokoapi.repository.ProductSpecs;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import com.hokomarketplace.hokoapi.util.SearchUtils;
import com.hokomarketplace.hokoapi.util.SlugUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository repository;
    private final SellerService sellerService;
    private final CategoryService categoryService;

    public ProductService(ProductRepository repository, SellerService sellerService, CategoryService categoryService) {
        this.repository = repository;
        this.sellerService = sellerService;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryDTO> search(ProductFilter f, Pageable pageable) {
        if (f.minPrice() != null && f.maxPrice() != null && f.minPrice().compareTo(f.maxPrice()) > 0) {
            throw new IllegalArgumentException("minPrice must be <= maxPrice");
        }
        if (f.sellerId() != null) {
            sellerService.get(f.sellerId(), false);
        }

        List<Specification<Product>> specs = new ArrayList<>();
        specs.add(ProductSpecs.notDeleted());
        if (f.search() != null && !f.search().isBlank()) {
            specs.add(ProductSpecs.nameContains(SearchUtils.normalize(f.search())));
        }
        if (f.categoryId() != null)   specs.add(ProductSpecs.hasCategory(f.categoryId()));
        if (f.categorySlug() != null) specs.add(ProductSpecs.hasCategorySlug(f.categorySlug()));
        if (f.sellerId() != null)     specs.add(ProductSpecs.hasSeller(f.sellerId()));
        if (f.minPrice() != null)     specs.add(ProductSpecs.priceGte(f.minPrice()));
        if (f.maxPrice() != null)     specs.add(ProductSpecs.priceLte(f.maxPrice()));
        if (Boolean.TRUE.equals(f.inStock())) specs.add(ProductSpecs.inStock());

        return repository.findAll(Specification.allOf(specs), pageable).map(ProductSummaryDTO::new);
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO get(UUID id) {
        Product product = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return new ProductResponseDTO(product);
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getBySlug(String slug) {
        Product product = repository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return new ProductResponseDTO(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryDTO> findMine(UUID userId, boolean includeDeleted, Pageable pageable) {
        Seller seller = sellerService.getByUserId(userId, false);

        List<Specification<Product>> specs = new ArrayList<>();
        specs.add(ProductSpecs.hasSeller(seller.getId()));
        if (!includeDeleted) {
            specs.add(ProductSpecs.notDeleted());
        }
        return repository.findAll(Specification.allOf(specs), pageable).map(ProductSummaryDTO::new);
    }

    @Transactional
    public ProductResponseDTO insert(UUID userId, ProductRequestDTO dto) {
        Seller seller = sellerService.getByUserId(userId, false);
        Category category = categoryService.findById(dto.categoryId());

        Product product = new Product();
        product.setSeller(seller);
        product.setCategory(category);
        product.setName(dto.name().trim());
        product.setSlug(slugFor(product.getName(), null));
        product.setDescription(clean(dto.description()));
        product.setPrice(dto.price());
        product.setQuantity(dto.quantity());
        product.replaceImages(urls(dto));

        return new ProductResponseDTO(repository.saveAndFlush(product));
    }

    @Transactional
    public ProductResponseDTO update(UUID userId, UUID id, ProductRequestDTO dto) {
        Product product = owned(userId, id);

        String name = dto.name().trim();
        String description = clean(dto.description());
        List<String> newUrls = urls(dto);

        boolean nameChanged = !product.getName().equals(name);
        boolean categoryChanged = !product.getCategory().getId().equals(dto.categoryId());
        boolean imagesChanged = !currentUrls(product).equals(newUrls);
        boolean otherChanged = !Objects.equals(product.getDescription(), description)
                || product.getPrice().compareTo(dto.price()) != 0   // compareTo: 10.0 == 10.00
                || !product.getQuantity().equals(dto.quantity());

        if (!nameChanged && !categoryChanged && !imagesChanged && !otherChanged) {
            return new ProductResponseDTO(product); // nada mudou: não grava
        }

        if (nameChanged) {
            product.setName(name);
            product.setSlug(slugFor(name, product.getId()));
        }
        if (categoryChanged) {
            product.setCategory(categoryService.findById(dto.categoryId()));
        }
        if (imagesChanged) {
            product.replaceImages(newUrls);
        }
        product.setDescription(description);
        product.setPrice(dto.price());
        product.setQuantity(dto.quantity());

        return new ProductResponseDTO(repository.saveAndFlush(product));
    }

    @Transactional
    public ProductResponseDTO updateStock(UUID userId, UUID id, int quantity) {
        Product product = owned(userId, id);
        product.setQuantity(quantity);
        return new ProductResponseDTO(repository.saveAndFlush(product));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Product product = owned(userId, id);
        product.setDeletedAt(Instant.now());
        repository.save(product);
    }

    private Product owned(UUID userId, UUID id) {
        Seller seller = sellerService.getByUserId(userId, false);
        return repository.findByIdAndSellerIdAndDeletedAtIsNull(id, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id + " for this store"));
    }

    private String slugFor(String name, UUID excludeId) {
        return SlugUtils.unique(name, slug -> repository.findBySlug(slug)
                .filter(p -> excludeId == null || !p.getId().equals(excludeId))
                .isPresent());
    }

    private static List<String> urls(ProductRequestDTO dto) {
        return dto.imageUrls() == null ? List.of() : dto.imageUrls().stream().map(String::trim).toList();
    }

    private static List<String> currentUrls(Product product) {
        return product.getImages().stream().map(ProductImage::getUrl).toList();
    }

    private static String clean(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}

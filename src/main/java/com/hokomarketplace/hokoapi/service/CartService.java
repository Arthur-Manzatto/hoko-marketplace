package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CartItemRequestDTO;
import com.hokomarketplace.hokoapi.dto.CartResponseDTO;
import com.hokomarketplace.hokoapi.entity.CartItem;
import com.hokomarketplace.hokoapi.entity.Product;
import com.hokomarketplace.hokoapi.repository.CartItemRepository;
import com.hokomarketplace.hokoapi.repository.ProductRepository;
import com.hokomarketplace.hokoapi.service.exception.BusinessException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Carrinho do usuário logado: uma linha de cart_items por produto.
 * Toda operação devolve o carrinho inteiro, montado dentro da transação.
 */
@Service
public class CartService {

    static final int MAX_PER_ITEM = 99;

    private final CartItemRepository repository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public CartService(CartItemRepository repository, ProductRepository productRepository, UserService userService) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public CartResponseDTO get(UUID userId) {
        return CartResponseDTO.of(repository.findByUserIdOrderByCreatedAtAsc(userId));
    }

    @Transactional
    public CartResponseDTO add(UUID userId, CartItemRequestDTO dto) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(dto.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.productId()));

        if (product.getSeller().getUser().getId().equals(userId)) {
            throw new BusinessException("You can't buy your own product");
        }

        CartItem item = repository.findByUserIdAndProductId(userId, product.getId())
                .orElseGet(() -> new CartItem(userService.get(userId, false), product, 0));

        int quantity = item.getQuantity() + dto.quantity(); // adicionar de novo soma
        checkQuantity(product, quantity);
        item.setQuantity(quantity);
        repository.saveAndFlush(item);

        return get(userId);
    }

    @Transactional
    public CartResponseDTO updateQuantity(UUID userId, UUID itemId, int quantity) {
        CartItem item = owned(userId, itemId);
        Product product = item.getProduct();
        if (product.getDeletedAt() != null) {
            throw new BusinessException("Product is no longer available");
        }
        checkQuantity(product, quantity);
        item.setQuantity(quantity);
        repository.saveAndFlush(item);

        return get(userId);
    }

    @Transactional
    public CartResponseDTO remove(UUID userId, UUID itemId) {
        repository.delete(owned(userId, itemId));
        repository.flush();
        return get(userId);
    }

    @Transactional
    public void clear(UUID userId) {
        repository.deleteAllByUserId(userId);
    }

    private CartItem owned(UUID userId, UUID itemId) {
        return repository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));
    }

    private static void checkQuantity(Product product, int quantity) {
        if (quantity > MAX_PER_ITEM) {
            throw new BusinessException("Maximum " + MAX_PER_ITEM + " units per product");
        }
        if (quantity > product.getQuantity()) {
            throw new BusinessException(product.getQuantity() == 0
                    ? "Product is out of stock"
                    : "Only " + product.getQuantity() + " in stock");
        }
    }
}

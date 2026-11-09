package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CartItemRequestDTO;
import com.hokomarketplace.hokoapi.dto.CartResponseDTO;
import com.hokomarketplace.hokoapi.entity.CartItem;
import com.hokomarketplace.hokoapi.entity.Product;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.repository.CartItemRepository;
import com.hokomarketplace.hokoapi.repository.ProductRepository;
import com.hokomarketplace.hokoapi.service.exception.BusinessException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CartServiceTest {

    private final CartItemRepository repository = mock(CartItemRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final UserService userService = mock(UserService.class);
    private final CartService service = new CartService(repository, productRepository, userService);

    private final UUID userId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(repository.saveAndFlush(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.get(userId, false)).thenReturn(new User());
    }

    @Test
    void addNewProductCreatesItem() {
        Product product = product(ownerId, "10.00", 5);
        when(productRepository.findByIdAndDeletedAtIsNull(product.getId())).thenReturn(Optional.of(product));
        when(repository.findByUserIdAndProductId(userId, product.getId())).thenReturn(Optional.empty());

        service.add(userId, new CartItemRequestDTO(product.getId(), 2));

        verify(repository).saveAndFlush(argThat(item -> item.getQuantity() == 2 && item.getProduct() == product));
    }

    @Test
    void addExistingProductSumsQuantity() {
        Product product = product(ownerId, "10.00", 5);
        CartItem existing = new CartItem(new User(), product, 2);
        when(productRepository.findByIdAndDeletedAtIsNull(product.getId())).thenReturn(Optional.of(product));
        when(repository.findByUserIdAndProductId(userId, product.getId())).thenReturn(Optional.of(existing));

        service.add(userId, new CartItemRequestDTO(product.getId(), 3));

        assertEquals(5, existing.getQuantity());
        verify(userService, never()).get(any(), anyBoolean());
    }

    @Test
    void addAboveStockIs422() {
        Product product = product(ownerId, "10.00", 5);
        CartItem existing = new CartItem(new User(), product, 4);
        when(productRepository.findByIdAndDeletedAtIsNull(product.getId())).thenReturn(Optional.of(product));
        when(repository.findByUserIdAndProductId(userId, product.getId())).thenReturn(Optional.of(existing));

        BusinessException e = assertThrows(BusinessException.class,
                () -> service.add(userId, new CartItemRequestDTO(product.getId(), 2)));

        assertEquals("Only 5 in stock", e.getMessage());
        assertEquals(4, existing.getQuantity());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void addOwnProductIs422() {
        Product product = product(userId, "10.00", 5);
        when(productRepository.findByIdAndDeletedAtIsNull(product.getId())).thenReturn(Optional.of(product));

        BusinessException e = assertThrows(BusinessException.class,
                () -> service.add(userId, new CartItemRequestDTO(product.getId(), 1)));

        assertEquals("You can't buy your own product", e.getMessage());
    }

    @Test
    void addDeletedOrMissingProductIs404() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findByIdAndDeletedAtIsNull(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.add(userId, new CartItemRequestDTO(productId, 1)));
    }

    @Test
    void unavailableItemsStayInCartButOutOfTotals() {
        Product ok = product(ownerId, "10.00", 5);
        Product deleted = product(ownerId, "20.00", 5);
        deleted.setDeletedAt(Instant.now());
        Product lowStock = product(ownerId, "30.00", 1);
        when(repository.findByUserIdOrderByCreatedAtAsc(userId)).thenReturn(List.of(
                new CartItem(new User(), ok, 2),
                new CartItem(new User(), deleted, 1),
                new CartItem(new User(), lowStock, 2)));

        CartResponseDTO cart = service.get(userId);

        assertEquals(3, cart.items().size());
        assertTrue(cart.items().get(0).available());
        assertFalse(cart.items().get(1).available());
        assertFalse(cart.items().get(2).available());
        assertEquals(2, cart.totalItems());
        assertEquals(0, new BigDecimal("20.00").compareTo(cart.subtotal()));
    }

    @Test
    void itemOfAnotherUserIs404() {
        UUID itemId = UUID.randomUUID();
        when(repository.findByIdAndUserId(itemId, userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateQuantity(userId, itemId, 1));
        assertThrows(ResourceNotFoundException.class, () -> service.remove(userId, itemId));
        verify(repository, never()).delete(any());
    }

    private static Product product(UUID sellerUserId, String price, int stock) {
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(sellerUserId);
        Seller seller = new Seller();
        seller.setUser(owner);
        seller.setStoreName("Loja");

        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", UUID.randomUUID());
        product.setSeller(seller);
        product.setName("Produto");
        product.setSlug("produto");
        product.setPrice(new BigDecimal(price));
        product.setQuantity(stock);
        return product;
    }
}

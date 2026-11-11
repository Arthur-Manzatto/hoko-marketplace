package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CheckoutRequestDTO;
import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.entity.*;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import com.hokomarketplace.hokoapi.entity.enums.PaymentStatus;
import com.hokomarketplace.hokoapi.repository.CartItemRepository;
import com.hokomarketplace.hokoapi.repository.OrderRepository;
import com.hokomarketplace.hokoapi.repository.ProductRepository;
import com.hokomarketplace.hokoapi.service.exception.BusinessException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    private final OrderRepository repository = mock(OrderRepository.class);
    private final CartItemRepository cartItemRepository = mock(CartItemRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final AddressService addressService = mock(AddressService.class);
    private final UserService userService = mock(UserService.class);
    private final OrderService service = new OrderService(
            repository, cartItemRepository, productRepository, addressService, userService);

    private final UUID userId = UUID.randomUUID();
    private final UUID addressId = UUID.randomUUID();

    private final Seller storeA = seller("Loja A");
    private final Seller storeB = seller("Loja B");

    @BeforeEach
    void setUp() {
        when(addressService.get(userId, addressId, false)).thenReturn(address());
        when(userService.get(userId, false)).thenReturn(new User());
        when(repository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(repository.saveAndFlush(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.decrementStock(any(), anyInt())).thenReturn(1);
    }

    // ------------------------------------------------------------- checkout

    @Test
    void checkoutCreatesOneOrderPerStore() {
        cart(item(product(storeA, "10.00", 5), 2),
             item(product(storeB, "50.00", 5), 1),
             item(product(storeA, "5.00", 5), 3));

        List<OrderResponseDTO> orders = service.checkout(userId, pix());

        assertEquals(2, orders.size());
        assertEquals("Loja A", orders.get(0).sellerStoreName());
        assertEquals(2, orders.get(0).items().size());
        assertEquals(0, new BigDecimal("35.00").compareTo(orders.get(0).total()));
        assertEquals("Loja B", orders.get(1).sellerStoreName());
        assertEquals(0, new BigDecimal("50.00").compareTo(orders.get(1).total()));
    }

    @Test
    void checkoutCopiesAddressPricesAndCreatesPendingPayment() {
        Product product = product(storeA, "10.00", 5);
        cart(item(product, 2));

        OrderResponseDTO order = service.checkout(userId, pix()).getFirst();

        assertEquals(OrderStatus.PENDING, order.status());
        assertEquals("Rua X", order.shippingAddress().street());
        assertEquals("SP", order.shippingAddress().state());
        assertEquals("Produto", order.items().getFirst().productName());
        assertEquals(0, new BigDecimal("10.00").compareTo(order.items().getFirst().unitPrice()));
        assertEquals(PaymentMethod.PIX, order.payment().method());
        assertEquals(PaymentStatus.PENDING, order.payment().status());
        assertEquals(0, order.total().compareTo(order.payment().amount()));
        verify(productRepository).decrementStock(product.getId(), 2);
    }

    @Test
    void checkoutEmptiesTheCart() {
        cart(item(product(storeA, "10.00", 5), 1));

        service.checkout(userId, pix());

        verify(cartItemRepository).deleteAllByUserId(userId);
    }

    @Test
    void checkoutWithEmptyCartIs422() {
        cart();

        BusinessException e = assertThrows(BusinessException.class, () -> service.checkout(userId, pix()));
        assertEquals("Cart is empty", e.getMessage());
    }

    @Test
    void checkoutWithUnavailableItemIs422() {
        cart(item(product(storeA, "10.00", 1), 3));

        BusinessException e = assertThrows(BusinessException.class, () -> service.checkout(userId, pix()));
        assertTrue(e.getMessage().startsWith("Some items are unavailable"));
        verify(productRepository, never()).decrementStock(any(), anyInt());
    }

    @Test
    void checkoutFailsWhenStockWasTakenMeanwhile() {
        cart(item(product(storeA, "10.00", 5), 2));
        when(productRepository.decrementStock(any(), anyInt())).thenReturn(0);

        assertThrows(BusinessException.class, () -> service.checkout(userId, pix()));
        verify(cartItemRepository, never()).deleteAllByUserId(any());
    }

    @Test
    void installmentsOnlyForCard() {
        cart(item(product(storeA, "10.00", 5), 1));

        assertThrows(BusinessException.class,
                () -> service.checkout(userId, new CheckoutRequestDTO(addressId, PaymentMethod.PIX, 3)));
        assertDoesNotThrow(
                () -> service.checkout(userId, new CheckoutRequestDTO(addressId, PaymentMethod.CARD, 3)));
    }

    // ------------------------------------------------------- pay / cancel

    @Test
    void payMarksOrderAndPaymentAsPaid() {
        Order order = order(OrderStatus.PENDING, PaymentStatus.PENDING);

        OrderResponseDTO paid = service.pay(userId, order.getId());

        assertEquals(OrderStatus.PAID, paid.status());
        assertEquals(PaymentStatus.PAID, paid.payment().status());
        assertNotNull(paid.payment().paidAt());
        assertTrue(order.getPayment().getProviderTxId().startsWith("SIM-"));
    }

    @Test
    void payingTwiceIs422() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);

        assertThrows(BusinessException.class, () -> service.pay(userId, order.getId()));
    }

    @Test
    void cancelPaidOrderRestoresStockAndRefunds() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);
        Product product = order.getItems().getFirst().getProduct();

        OrderResponseDTO canceled = service.cancel(userId, order.getId());

        assertEquals(OrderStatus.CANCELED, canceled.status());
        assertEquals(PaymentStatus.REFUNDED, canceled.payment().status());
        verify(productRepository).incrementStock(product.getId(), 2);
    }

    @Test
    void cancelShippedOrderIs422() {
        Order order = order(OrderStatus.SHIPPED, PaymentStatus.PAID);

        assertThrows(BusinessException.class, () -> service.cancel(userId, order.getId()));
        verify(productRepository, never()).incrementStock(any(), anyInt());
    }

    @Test
    void orderOfAnotherUserIs404() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndUserId(id, userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.get(userId, id));
        assertThrows(ResourceNotFoundException.class, () -> service.pay(userId, id));
        assertThrows(ResourceNotFoundException.class, () -> service.cancel(userId, id));
    }

    // ------------------------------------------------------------- helpers

    private CheckoutRequestDTO pix() {
        return new CheckoutRequestDTO(addressId, PaymentMethod.PIX, null);
    }

    private void cart(CartItem... items) {
        when(cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId)).thenReturn(List.of(items));
    }

    private static CartItem item(Product product, int quantity) {
        return new CartItem(new User(), product, quantity);
    }

    private Order order(OrderStatus status, PaymentStatus paymentStatus) {
        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", UUID.randomUUID());
        order.setSeller(storeA);
        order.shipTo(address());
        order.addItem(new OrderItem(product(storeA, "10.00", 5), "Produto", null, new BigDecimal("10.00"), 2));
        order.setTotal(new BigDecimal("20.00"));
        Payment payment = new Payment(PaymentMethod.PIX, order.getTotal(), 1, OrderService.PROVIDER);
        payment.setStatus(paymentStatus);
        order.setPayment(payment);
        order.setStatus(status);
        when(repository.findByIdAndUserId(order.getId(), userId)).thenReturn(Optional.of(order));
        return order;
    }

    private static Seller seller(String name) {
        Seller seller = new Seller();
        seller.setId(UUID.randomUUID());
        seller.setStoreName(name);
        seller.setUser(mock(User.class));
        return seller;
    }

    private static Product product(Seller seller, String price, int stock) {
        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", UUID.randomUUID());
        product.setSeller(seller);
        product.setName("Produto");
        product.setSlug("produto");
        product.setPrice(new BigDecimal(price));
        product.setQuantity(stock);
        return product;
    }

    private static Address address() {
        Address address = new Address();
        address.setStreet("Rua X");
        address.setNumber("1");
        address.setNeighborhood("Centro");
        address.setCity("Campinas");
        address.setState("SP");
        address.setZipCode("13010-000");
        return address;
    }
}

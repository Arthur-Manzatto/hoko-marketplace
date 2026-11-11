package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.dto.SalesSummaryDTO;
import com.hokomarketplace.hokoapi.dto.ShipOrderDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class SellerOrderServiceTest {

    private final OrderRepository repository = mock(OrderRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final SellerService sellerService = mock(SellerService.class);
    private final OrderService orderService = new OrderService(repository, mock(CartItemRepository.class),
            productRepository, mock(AddressService.class), mock(UserService.class));
    private final SellerOrderService service = new SellerOrderService(repository, sellerService, orderService);

    private final UUID userId = UUID.randomUUID();
    private final Seller store = new Seller();

    @BeforeEach
    void setUp() {
        store.setId(UUID.randomUUID());
        store.setStoreName("Minha Loja");
        when(sellerService.getByUserId(userId, false)).thenReturn(store);
        when(repository.saveAndFlush(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void listUsesTheStoreOfTheToken() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(repository.findBySellerId(store.getId(), pageable)).thenReturn(Page.empty());

        service.findMine(userId, null, pageable);

        verify(repository).findBySellerId(store.getId(), pageable);
    }

    @Test
    void shipPaidOrder() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);

        OrderResponseDTO shipped = service.ship(userId, order.getId(), new ShipOrderDTO(" aa123456789br "));

        assertEquals(OrderStatus.SHIPPED, shipped.status());
        assertEquals("AA123456789BR", shipped.trackingCode());
        assertNotNull(shipped.shippedAt());
    }

    @Test
    void shipWithoutTrackingCode() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);

        OrderResponseDTO shipped = service.ship(userId, order.getId(), null);

        assertEquals(OrderStatus.SHIPPED, shipped.status());
        assertNull(shipped.trackingCode());
    }

    @Test
    void shipUnpaidOrderIs422() {
        Order order = order(OrderStatus.PENDING, PaymentStatus.PENDING);

        BusinessException e = assertThrows(BusinessException.class,
                () -> service.ship(userId, order.getId(), null));
        assertEquals("Only paid orders can be shipped (status PENDING)", e.getMessage());
    }

    @Test
    void deliverShippedOrder() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);
        order.ship(null);

        OrderResponseDTO delivered = service.deliver(userId, order.getId());

        assertEquals(OrderStatus.DELIVERED, delivered.status());
        assertNotNull(delivered.deliveredAt());
    }

    @Test
    void deliverNotShippedOrderIs422() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);

        assertThrows(BusinessException.class, () -> service.deliver(userId, order.getId()));
    }

    @Test
    void sellerCancelsPaidOrderRestoringStockAndRefunding() {
        Order order = order(OrderStatus.PAID, PaymentStatus.PAID);
        Product product = order.getItems().getFirst().getProduct();

        OrderResponseDTO canceled = service.cancel(userId, order.getId());

        assertEquals(OrderStatus.CANCELED, canceled.status());
        assertEquals(PaymentStatus.REFUNDED, canceled.payment().status());
        verify(productRepository).incrementStock(product.getId(), 2);
    }

    @Test
    void orderOfAnotherStoreIs404() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndSellerId(id, store.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.get(userId, id));
        assertThrows(ResourceNotFoundException.class, () -> service.ship(userId, id, null));
        verify(productRepository, never()).incrementStock(any(), anyInt());
    }

    @Test
    void userWithoutStoreIs404() {
        UUID other = UUID.randomUUID();
        when(sellerService.getByUserId(other, false)).thenThrow(new ResourceNotFoundException("no store"));

        assertThrows(ResourceNotFoundException.class, () -> service.summary(other));
    }

    @Test
    void summaryCountsOnlyPaidAsRevenueAndFillsMissingStatuses() {
        when(repository.sumBySeller(store.getId())).thenReturn(List.of(
                row(OrderStatus.PENDING, 1, "30.00"),
                row(OrderStatus.PAID, 2, "100.00"),
                row(OrderStatus.DELIVERED, 1, "50.00"),
                row(OrderStatus.CANCELED, 3, "999.00")));

        SalesSummaryDTO summary = service.summary(userId);

        assertEquals(0, new BigDecimal("150.00").compareTo(summary.revenue()));
        assertEquals(0, new BigDecimal("30.00").compareTo(summary.pendingRevenue()));
        assertEquals(2, summary.toShip());
        assertEquals(0L, summary.ordersByStatus().get(OrderStatus.SHIPPED));
        assertEquals(5, summary.ordersByStatus().size());
    }

    // ------------------------------------------------------------- helpers

    private Order order(OrderStatus status, PaymentStatus paymentStatus) {
        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", UUID.randomUUID());

        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", UUID.randomUUID());
        order.setSeller(store);
        order.addItem(new OrderItem(product, "Produto", null, new BigDecimal("10.00"), 2));
        order.setTotal(new BigDecimal("20.00"));
        Payment payment = new Payment(PaymentMethod.PIX, order.getTotal(), 1, OrderService.PROVIDER);
        payment.setStatus(paymentStatus);
        order.setPayment(payment);
        order.setStatus(status);
        when(repository.findByIdAndSellerId(order.getId(), store.getId())).thenReturn(Optional.of(order));
        return order;
    }

    private static OrderRepository.StatusTotal row(OrderStatus status, long count, String total) {
        return new OrderRepository.StatusTotal() {
            public OrderStatus getStatus() { return status; }
            public long getCount() { return count; }
            public BigDecimal getTotal() { return new BigDecimal(total); }
        };
    }
}

package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.CartItemDTO;
import com.hokomarketplace.hokoapi.dto.CheckoutRequestDTO;
import com.hokomarketplace.hokoapi.dto.OrderResponseDTO;
import com.hokomarketplace.hokoapi.dto.OrderSummaryDTO;
import com.hokomarketplace.hokoapi.entity.*;
import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import com.hokomarketplace.hokoapi.entity.enums.PaymentMethod;
import com.hokomarketplace.hokoapi.entity.enums.PaymentStatus;
import com.hokomarketplace.hokoapi.repository.CartItemRepository;
import com.hokomarketplace.hokoapi.repository.OrderRepository;
import com.hokomarketplace.hokoapi.repository.ProductRepository;
import com.hokomarketplace.hokoapi.service.exception.BusinessException;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Pedidos do comprador logado. O checkout gera UM pedido por loja do carrinho,
 * copia preço/endereço, baixa o estoque e cria o pagamento (simulado) pendente.
 */
@Service
public class OrderService {

    static final String PROVIDER = "SIMULATED";

    private final OrderRepository repository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AddressService addressService;
    private final UserService userService;

    public OrderService(OrderRepository repository, CartItemRepository cartItemRepository,
                        ProductRepository productRepository, AddressService addressService,
                        UserService userService) {
        this.repository = repository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.addressService = addressService;
        this.userService = userService;
    }

    /** Tudo numa transação: ou cria todos os pedidos, ou nenhum. */
    @Transactional
    public List<OrderResponseDTO> checkout(UUID userId, CheckoutRequestDTO dto) {
        Address address = addressService.get(userId, dto.addressId(), false);

        int installments = dto.installmentsOrDefault();
        if (installments > 1 && dto.paymentMethod() != PaymentMethod.CARD) {
            throw new BusinessException("Installments are only allowed for CARD");
        }

        List<CartItem> cart = cartItemRepository.findByUserIdOrderByCreatedAtAsc(userId);
        if (cart.isEmpty()) {
            throw new BusinessException("Cart is empty");
        }
        List<String> unavailable = cart.stream()
                .filter(item -> !new CartItemDTO(item).available())
                .map(item -> item.getProduct().getName())
                .toList();
        if (!unavailable.isEmpty()) {
            throw new BusinessException("Some items are unavailable: " + String.join(", ", unavailable));
        }

        User user = userService.get(userId, false);

        // um pedido por loja, na ordem em que os itens entraram no carrinho
        Map<Seller, List<CartItem>> bySeller = new LinkedHashMap<>();
        for (CartItem item : cart) {
            bySeller.computeIfAbsent(item.getProduct().getSeller(), s -> new ArrayList<>()).add(item);
        }

        List<Order> orders = new ArrayList<>();
        for (Map.Entry<Seller, List<CartItem>> entry : bySeller.entrySet()) {
            Order order = new Order();
            order.setUser(user);
            order.setSeller(entry.getKey());
            order.shipTo(address);

            for (CartItem cartItem : entry.getValue()) {
                Product product = cartItem.getProduct();
                if (productRepository.decrementStock(product.getId(), cartItem.getQuantity()) == 0) {
                    // outra compra levou o estoque entre a leitura e agora: desfaz tudo
                    throw new BusinessException("Not enough stock for " + product.getName());
                }
                order.addItem(new OrderItem(
                        product,
                        product.getName(),
                        product.getImages().isEmpty() ? null : product.getImages().getFirst().getUrl(),
                        product.getPrice(),
                        cartItem.getQuantity()));
            }

            BigDecimal total = order.getSubtotal().add(order.getShippingCost());
            order.setTotal(total);
            order.setPayment(new Payment(dto.paymentMethod(), total, installments, PROVIDER));
            orders.add(repository.save(order));
        }

        cartItemRepository.deleteAllByUserId(userId);
        repository.flush();

        return orders.stream().map(OrderResponseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryDTO> findMine(UUID userId, OrderStatus status, Pageable pageable) {
        Page<Order> page = status == null
                ? repository.findByUserId(userId, pageable)
                : repository.findByUserIdAndStatus(userId, status, pageable);
        return page.map(OrderSummaryDTO::new);
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO get(UUID userId, UUID id) {
        return new OrderResponseDTO(owned(userId, id));
    }

    /** Pagamento simulado: confirma na hora, sem gateway. */
    @Transactional
    public OrderResponseDTO pay(UUID userId, UUID id) {
        Order order = owned(userId, id);
        Payment payment = order.getPayment();
        if (order.getStatus() != OrderStatus.PENDING || payment.getStatus() != PaymentStatus.PENDING) {
            throw new BusinessException("Order can't be paid (status " + order.getStatus() + ")");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        payment.setProviderTxId("SIM-" + UUID.randomUUID());
        order.setStatus(OrderStatus.PAID);

        return new OrderResponseDTO(repository.saveAndFlush(order));
    }

    @Transactional
    public OrderResponseDTO cancel(UUID userId, UUID id) {
        Order order = owned(userId, id);
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException(order.getStatus() == OrderStatus.CANCELED
                    ? "Order is already canceled"
                    : "Order can't be canceled after shipping");
        }

        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                productRepository.incrementStock(item.getProduct().getId(), item.getQuantity());
            }
        }

        Payment payment = order.getPayment();
        payment.setStatus(payment.getStatus() == PaymentStatus.PAID ? PaymentStatus.REFUNDED : PaymentStatus.FAILED);
        order.setStatus(OrderStatus.CANCELED);

        return new OrderResponseDTO(repository.saveAndFlush(order));
    }

    private Order owned(UUID userId, UUID id) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }
}

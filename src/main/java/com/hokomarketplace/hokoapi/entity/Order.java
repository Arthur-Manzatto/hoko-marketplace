package com.hokomarketplace.hokoapi.entity;

import com.hokomarketplace.hokoapi.entity.enums.OrderStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Pedido de um comprador para UMA loja (o checkout gera um pedido por loja).
 * O endereço é copiado nos campos ship_*: o pedido não muda se o endereço for editado.
 * Nome de entidade CustomerOrder porque "Order" é palavra reservada no JPQL.
 */
@Entity(name = "CustomerOrder")
@Table(name = "orders")
public class Order implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(name = "shipping_cost", nullable = false)
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "ship_street", nullable = false)
    private String shipStreet;

    @Column(name = "ship_number", nullable = false)
    private String shipNumber;

    @Column(name = "ship_complement")
    private String shipComplement;

    @Column(name = "ship_neighborhood", nullable = false)
    private String shipNeighborhood;

    @Column(name = "ship_city", nullable = false)
    private String shipCity;

    @Column(name = "ship_state", nullable = false)
    private String shipState;

    @Column(name = "ship_zip_code", nullable = false)
    private String shipZipCode;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Order() {
    }

    /** Copia o endereço para o pedido (snapshot). */
    public void shipTo(Address address) {
        this.address = address;
        this.shipStreet = address.getStreet();
        this.shipNumber = address.getNumber();
        this.shipComplement = address.getComplement();
        this.shipNeighborhood = address.getNeighborhood();
        this.shipCity = address.getCity();
        this.shipState = address.getState();
        this.shipZipCode = address.getZipCode();
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public BigDecimal getSubtotal() {
        return items.stream().map(OrderItem::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Seller getSeller() {
        return seller;
    }

    public void setSeller(Seller seller) {
        this.seller = seller;
    }

    public Address getAddress() {
        return address;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getShippingCost() {
        return shippingCost;
    }

    public void setShippingCost(BigDecimal shippingCost) {
        this.shippingCost = shippingCost;
    }

    public String getShipStreet() {
        return shipStreet;
    }

    public String getShipNumber() {
        return shipNumber;
    }

    public String getShipComplement() {
        return shipComplement;
    }

    public String getShipNeighborhood() {
        return shipNeighborhood;
    }

    public String getShipCity() {
        return shipCity;
    }

    public String getShipState() {
        return shipState;
    }

    public String getShipZipCode() {
        return shipZipCode;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        payment.setOrder(this);
        this.payment = payment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Order that = (Order) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}

package com.hokomarketplace.hokoapi.service;

import com.hokomarketplace.hokoapi.dto.SellerRequestDTO;
import com.hokomarketplace.hokoapi.entity.Seller;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.repository.SellerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class SellerServiceTest {

    private final SellerRepository repository = mock(SellerRepository.class);
    private final UserService userService = mock(UserService.class);
    private final SellerService service = new SellerService(repository, userService);

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(repository.saveAndFlush(any(Seller.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void insertGeneratesSlugWithSuffixWhenTaken() {
        when(userService.get(userId, false)).thenReturn(new User());
        Seller other = seller(UUID.randomUUID(), "Loja Boa", "11111111111");
        when(repository.findBySlug("loja-boa")).thenReturn(Optional.of(other));
        when(repository.findBySlug("loja-boa-1")).thenReturn(Optional.empty());

        Seller created = service.insert(userId, new SellerRequestDTO("  Loja Boa ", "12345678901"));

        assertEquals("Loja Boa", created.getStoreName());
        assertEquals("loja-boa-1", created.getSlug());
    }

    @Test
    void updateWithoutChangesSkipsSaveAndSlugLookup() {
        Seller existing = seller(UUID.randomUUID(), "Loja Boa", "12345678901");
        when(repository.findByUserIdActive(userId)).thenReturn(Optional.of(existing));

        service.update(userId, new SellerRequestDTO("Loja Boa", "12345678901"));

        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).findBySlug(anyString());
    }

    @Test
    void updateOnlyDocumentKeepsSlug() {
        Seller existing = seller(UUID.randomUUID(), "Loja Boa", "12345678901");
        existing.setSlug("loja-boa");
        when(repository.findByUserIdActive(userId)).thenReturn(Optional.of(existing));

        Seller updated = service.update(userId, new SellerRequestDTO("Loja Boa", "98765432100"));

        assertEquals("98765432100", updated.getDocument());
        assertEquals("loja-boa", updated.getSlug());
        verify(repository, never()).findBySlug(anyString());
    }

    @Test
    void insertReopensDeletedStoreInsteadOfCreatingAnother() {
        when(userService.get(userId, false)).thenReturn(new User());
        UUID oldId = UUID.randomUUID();
        Seller deleted = seller(oldId, "Loja Velha", "11111111111");
        deleted.setSlug("loja-velha");
        deleted.setDeletedAt(Instant.now());
        when(repository.findByUserId(userId)).thenReturn(Optional.of(deleted));

        Seller reopened = service.insert(userId, new SellerRequestDTO("Loja Nova", "12345678901"));

        assertSame(deleted, reopened);
        assertEquals(oldId, reopened.getId());
        assertNull(reopened.getDeletedAt());
        assertEquals("Loja Nova", reopened.getStoreName());
        assertEquals("loja-nova", reopened.getSlug());
        assertEquals("12345678901", reopened.getDocument());
    }

    @Test
    void insertWithActiveStoreCreatesNewEntitySoDatabaseRejectsIt() {
        when(userService.get(userId, false)).thenReturn(new User());
        Seller active = seller(UUID.randomUUID(), "Loja Ativa", "11111111111");
        when(repository.findByUserId(userId)).thenReturn(Optional.of(active));

        Seller created = service.insert(userId, new SellerRequestDTO("Outra Loja", "12345678901"));

        // não reaproveita a loja ativa: vai como insert novo e o UNIQUE de user_id dá 409
        assertNotSame(active, created);
        assertNull(created.getId());
    }

    private static Seller seller(UUID id, String name, String document) {
        Seller s = new Seller();
        s.setId(id);
        s.setStoreName(name);
        s.setDocument(document);
        return s;
    }
}

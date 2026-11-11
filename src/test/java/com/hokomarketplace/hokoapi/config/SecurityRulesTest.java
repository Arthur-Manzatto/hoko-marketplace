package com.hokomarketplace.hokoapi.config;

import com.hokomarketplace.hokoapi.dto.CartResponseDTO;
import com.hokomarketplace.hokoapi.dto.ProductResponseDTO;
import com.hokomarketplace.hokoapi.dto.filters.ProductFilter;
import com.hokomarketplace.hokoapi.entity.Category;
import com.hokomarketplace.hokoapi.entity.User;
import com.hokomarketplace.hokoapi.service.*;
import com.hokomarketplace.hokoapi.service.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regras de acesso da API sem token real nem banco: os services são mocks e o jwt()
 * do spring-security-test simula o token do Supabase, usando o mesmo conversor de roles.
 */
@WebMvcTest
@Import({SecurityConfig.class, CorsConfig.class})
@TestPropertySource(properties = "CORS_ALLOWED_ORIGINS=http://localhost:5173")
class SecurityRulesTest {

    @Autowired MockMvc mvc;

    @MockitoBean JwtDecoder jwtDecoder;
    @MockitoBean UserService userService;
    @MockitoBean SellerService sellerService;
    @MockitoBean ProductService productService;
    @MockitoBean CategoryService categoryService;
    @MockitoBean AddressService addressService;
    @MockitoBean CartService cartService;
    @MockitoBean OrderService orderService;

    private final UUID userId = UUID.randomUUID();

    private JwtRequestPostProcessor user() {
        return jwt().jwt(j -> j.subject(userId.toString())
                        .claim("app_metadata", Map.of("provider", "email")))
                .authorities(SecurityConfig::authorities);
    }

    private JwtRequestPostProcessor admin() {
        return jwt().jwt(j -> j.subject(userId.toString())
                        .claim("app_metadata", Map.of("provider", "email", "role", "admin")))
                .authorities(SecurityConfig::authorities);
    }

    @BeforeEach
    void setUp() {
        when(categoryService.findAll(any(), any())).thenReturn(Page.empty());
        Category games = new Category();
        games.setName("Games");
        games.setSlug("games");
        games.setIcon("bi-controller");
        when(categoryService.findBySlug("games")).thenReturn(games);
        when(categoryService.insert(any())).thenReturn(games);
        when(productService.search(any(ProductFilter.class), any())).thenReturn(Page.empty());
        when(userService.get(any(), eq(false))).thenReturn(new User());
        when(sellerService.getByUserId(any(), eq(false))).thenThrow(new ResourceNotFoundException("no store"));
    }

    // ------------------------------------------------- front atual não quebra

    @Test
    void staticFrontIsNeverBlocked() throws Exception {
        for (String path : List.of("/", "/index.html", "/categorias.html", "/login.html",
                "/js/ui.js", "/js/api.js", "/css/style.css", "/img/logo.svg")) {
            mvc.perform(get(path)).andExpect(status().isOk());
        }
        // página que ainda não existe: 404 normal, não 401/403
        mvc.perform(get("/qualquer/coisa.html")).andExpect(status().isNotFound());
    }

    @Test
    void endpointsUsedByTheFrontTodayArePublic() throws Exception {
        mvc.perform(get("/api/categories").param("size", "8").param("sort", "name,asc"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/categories/slug/games"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Games"));
        mvc.perform(get("/api/products").param("categorySlug", "eletronicos").param("size", "4"))
                .andExpect(status().isOk());
    }

    @Test
    void corsPreflightForAuthenticatedRequestPasses() throws Exception {
        mvc.perform(options("/api/me")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    // -------------------------------------------------------------- /api/me

    @Test
    void meWithoutTokenIs401Json() throws Exception {
        mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication required"))
                .andExpect(jsonPath("$.path").value("/api/me"));
    }

    @Test
    void meUsesTheUserIdFromTheToken() throws Exception {
        mvc.perform(get("/api/me").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(false))
                .andExpect(jsonPath("$.seller").doesNotExist());
        verify(userService).get(userId, false);
    }

    @Test
    void meShowsAdminFlag() throws Exception {
        mvc.perform(get("/api/me").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    void sellerProductsAreCreatedForTheTokenOwner() throws Exception {
        UUID productId = UUID.randomUUID();
        when(productService.insert(eq(userId), any())).thenReturn(new ProductResponseDTO(
                productId, "Teclado", "teclado", null, new BigDecimal("10.00"), 1, List.of(),
                UUID.randomUUID(), "Loja", "loja", UUID.randomUUID(), "Periféricos", "perifericos",
                Instant.now(), Instant.now(), null));

        mvc.perform(post("/api/me/seller/products").with(user())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Teclado","price":10,"quantity":1,"categoryId":"%s"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/products/" + productId));
        verify(productService).insert(eq(userId), any());
    }

    // ----------------------------------------------------------- /api/me/cart

    @Test
    void cartNeedsLoginAndUsesTheTokenOwner() throws Exception {
        when(cartService.get(userId)).thenReturn(new CartResponseDTO(List.of(), 0, BigDecimal.ZERO));

        mvc.perform(get("/api/me/cart")).andExpect(status().isUnauthorized());

        mvc.perform(get("/api/me/cart").with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(0));
        verify(cartService).get(userId);
    }

    @Test
    void cartRejectsInvalidQuantity() throws Exception {
        mvc.perform(post("/api/me/cart/items").with(user())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"%s","quantity":0}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isUnprocessableContent());
        verify(cartService, never()).add(any(), any());
    }

    // --------------------------------------------------------- /api/me/orders

    @Test
    void checkoutNeedsLoginAndUsesTheTokenOwner() throws Exception {
        String body = """
                {"addressId":"%s","paymentMethod":"PIX"}""".formatted(UUID.randomUUID());
        when(orderService.checkout(eq(userId), any())).thenReturn(List.of());

        mvc.perform(post("/api/me/orders/checkout").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/me/orders/checkout").with(user()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        verify(orderService).checkout(eq(userId), any());
    }

    // ----------------------------------------------------------------- admin

    @Test
    void categoryWritesNeedAdmin() throws Exception {
        String body = """
                {"name":"Instrumentos","icon":"bi-music-note"}""";

        mvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/categories").with(user()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));

        mvc.perform(post("/api/categories").with(admin()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
        verify(categoryService).insert(any());
    }

    @Test
    void usersListIsAdminOnly() throws Exception {
        when(userService.findAll(any(), anyBoolean(), any())).thenReturn(Page.empty());

        mvc.perform(get("/api/users").with(user())).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").with(admin())).andExpect(status().isOk());
    }

    @Test
    void deletedSellersOnlyForAdmin() throws Exception {
        when(sellerService.findAll(any(), anyBoolean(), any())).thenReturn(Page.empty());

        mvc.perform(get("/api/sellers").param("includeDeleted", "true")).andExpect(status().isOk());
        verify(sellerService).findAll(null, false, org.springframework.data.domain.PageRequest.of(0, 20));

        mvc.perform(get("/api/sellers").param("includeDeleted", "true").with(admin())).andExpect(status().isOk());
        verify(sellerService).findAll(null, true, org.springframework.data.domain.PageRequest.of(0, 20));
    }

    // -------------------------------------------- rotas fechadas por padrão

    @Test
    void unknownAndOldApiRoutesAreClosed() throws Exception {
        mvc.perform(get("/api/xyz")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/xyz").with(user())).andExpect(status().isForbidden());
        // rotas antigas com {userId} não existem mais e não ficam abertas
        mvc.perform(get("/api/users/" + UUID.randomUUID() + "/seller").with(user()))
                .andExpect(status().isForbidden());
    }
}

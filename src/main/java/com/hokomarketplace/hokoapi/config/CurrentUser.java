package com.hokomarketplace.hokoapi.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

/** Quem está chamando a API, a partir do JWT do Supabase. */
public final class CurrentUser {

    private CurrentUser() {}

    /** O "sub" do token é o id do usuário em auth.users = public.users. */
    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public static boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}

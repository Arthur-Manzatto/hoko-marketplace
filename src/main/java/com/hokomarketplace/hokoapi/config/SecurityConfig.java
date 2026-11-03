package com.hokomarketplace.hokoapi.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * A API valida o JWT do Supabase Auth (header Authorization: Bearer <access_token>).
 * O "sub" do token é o id do usuário em public.users. Admin = app_metadata.role "admin".
 *
 * Só /api/** é protegido: páginas, css, js e imagens do front ficam livres.
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())                 // token Bearer, sem cookie de sessão
                .cors(Customizer.withDefaults())              // usa o CorsConfigurationSource do CorsConfig
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // o Spring encaminha erros (404 de estático, 500) para /error
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        // vitrine pública
                        .requestMatchers(HttpMethod.GET, "/api/categories/**", "/api/sellers/**", "/api/products/**").permitAll()
                        // administração
                        .requestMatchers("/api/categories/**", "/api/users/**").hasRole("ADMIN")
                        // conta do usuário logado
                        .requestMatchers("/api/me/**").authenticated()
                        // qualquer outra rota da API: fechada até ser liberada aqui
                        .requestMatchers("/api/**").denyAll()
                        // front estático
                        .anyRequest().permitAll())
                .oauth2ResourceServer(o -> o
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(req, res, HttpStatus.UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(req, res, HttpStatus.FORBIDDEN, "Access denied")))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(req, res, HttpStatus.UNAUTHORIZED, "Authentication required"))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(req, res, HttpStatus.FORBIDDEN, "Access denied")));
        return http.build();
    }

    private static JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(SecurityConfig::authorities);
        return converter;
    }

    // package-private: o SecurityRulesTest usa o mesmo conversor dos tokens reais
    static Collection<GrantedAuthority> authorities(Jwt jwt) {
        Map<String, Object> appMetadata = jwt.getClaimAsMap("app_metadata");
        if (appMetadata != null && "admin".equals(appMetadata.get("role"))) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /** 401/403 no mesmo formato do StandardError usado pelo ResourceExceptionHandler. */
    private static void writeError(HttpServletRequest request, HttpServletResponse response,
                                   HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s","path":"%s"}"""
                .formatted(Instant.now().truncatedTo(ChronoUnit.SECONDS), status.value(),
                        status.getReasonPhrase(), message, json(request.getRequestURI())));
    }

    private static String json(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

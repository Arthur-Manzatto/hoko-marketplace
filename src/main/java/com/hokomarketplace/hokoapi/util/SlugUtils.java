package com.hokomarketplace.hokoapi.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class SlugUtils {

    private SlugUtils() {}

    public static String slugify(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
    }

    /** Slug de {@code text}; se {@code taken} disser que já existe, tenta base-1, base-2... */
    public static String unique(String text, Predicate<String> taken) {
        String base = slugify(text);
        String slug = base;
        for (int i = 1; taken.test(slug); i++) {
            slug = base + "-" + i;
        }
        return slug;
    }
}

package com.hokomarketplace.hokoapi.utils;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtils {

    private SlugUtils() {}

    public static String slugify(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
    }
}
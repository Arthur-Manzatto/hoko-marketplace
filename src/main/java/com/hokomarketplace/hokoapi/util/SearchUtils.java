package com.hokomarketplace.hokoapi.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SearchUtils {

    private SearchUtils() {}

    public static String normalize(String text) {
        if (text == null || text.isBlank()) return "";
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim();
    }
}
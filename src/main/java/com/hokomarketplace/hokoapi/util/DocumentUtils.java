package com.hokomarketplace.hokoapi.util;

/**
 * Validação de CPF e CNPJ pelos dígitos verificadores (módulo 11).
 * Recebe só dígitos (o formato 11/14 dígitos já é checado no DTO).
 * Sequências repetidas (00000000000, 11111111111...) passam no cálculo mas não existem: são recusadas.
 */
public final class DocumentUtils {

    private DocumentUtils() { }

    public static boolean isValid(String document) {
        if (document == null) return false;
        return switch (document.length()) {
            case 11 -> isValidCpf(document);
            case 14 -> isValidCnpj(document);
            default -> false;
        };
    }

    public static boolean isValidCpf(String cpf) {
        if (cpf == null || !cpf.matches("\\d{11}") || allSame(cpf)) return false;
        return checkDigit(cpf, 9, 10) == digit(cpf, 9)
                && checkDigit(cpf, 10, 11) == digit(cpf, 10);
    }

    public static boolean isValidCnpj(String cnpj) {
        if (cnpj == null || !cnpj.matches("\\d{14}") || allSame(cnpj)) return false;
        int[] first = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] second = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return cnpjDigit(cnpj, first) == digit(cnpj, 12)
                && cnpjDigit(cnpj, second) == digit(cnpj, 13);
    }

    /** CPF: soma dos `length` primeiros dígitos com pesos firstWeight, firstWeight-1, ..., 2. */
    private static int checkDigit(String cpf, int length, int firstWeight) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += digit(cpf, i) * (firstWeight - i);
        }
        int rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    }

    private static int cnpjDigit(String cnpj, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += digit(cnpj, i) * weights[i];
        }
        int rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    }

    private static int digit(String s, int i) {
        return s.charAt(i) - '0';
    }

    private static boolean allSame(String s) {
        return s.chars().allMatch(c -> c == s.charAt(0));
    }
}

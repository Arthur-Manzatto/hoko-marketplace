const SUPABASE_URL = "https://ufdgevqpgowaaxblrnwf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_I1F2Q1i0nFLbsMkFDZJHhQ_KNKxyFIO";

const sdk = window.supabase;

if (!sdk) {
    throw new Error(
        "SDK do Supabase não carregou. " +
        "A tag <script> do CDN precisa vir antes dos módulos."
    );
}

export const supabase = sdk.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
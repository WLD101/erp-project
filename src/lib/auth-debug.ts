import { createClient } from '@supabase/supabase-js';

// NOTE: Ensure you have your environment variables set for this to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * debugAuthSession
 * 
 * Retrieves the current session, decodes the JWT (which is just base64 encoded),
 * and logs the custom claims 'org_id' and 'role' found in 'app_metadata'.
 */
export async function debugAuthSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error fetching session:', error);
        return;
    }

    if (!session) {
        console.log('No active session found.');
        return;
    }

    const accessToken = session.access_token;

    try {
        // JWT structure: Header.Payload.Signature
        const payloadPart = accessToken.split('.')[1];
        // Base64 decode
        const decodedPayload = JSON.parse(atob(payloadPart));

        console.log('--- Auth Debug Info ---');
        console.log('User ID:', session.user.id);
        console.log('Email:', session.user.email);

        // Check app_metadata
        const appMetadata = decodedPayload.app_metadata || {};

        console.log('--- Custom Claims (app_metadata) ---');
        console.log('Role:', appMetadata.role);
        console.log('Org ID (Tenant):', appMetadata.org_id);

        if (appMetadata.org_id && appMetadata.role) {
            console.log('✅ Custom claims present.');
        } else {
            console.warn('⚠️ Custom claims missing. Check custom_access_token_hook configuration.');
        }

    } catch (e) {
        console.error('Failed to decode access token:', e);
    }
}

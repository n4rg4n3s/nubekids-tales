import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';

interface CreateTokenPayload {
    tenantId?: string;
    itemName?: string;
    itemImageUrl?: string;
    customerEmail?: string;
    expiresInHours?: number;
}

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DEFAULT_EXPIRY_HOURS = 24 * 30;
const MAX_EXPIRY_HOURS = 24 * 90;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = normalizePayload(req.body as CreateTokenPayload);
        const tenantSecret = String(req.headers['x-nubekids-tenant-secret'] || '').trim();

        if (!payload.tenantId) {
            return res.status(400).json({ error: 'tenantId es obligatorio' });
        }

        if (!tenantSecret) {
            return res.status(401).json({ error: 'Falta x-nubekids-tenant-secret' });
        }

        if (payload.customerEmail && !EMAIL_REGEX.test(payload.customerEmail)) {
            return res.status(400).json({ error: 'customerEmail no es válido' });
        }

        const { data: tenantRow, error: tenantError } = await supabase
            .from('tenants')
            .select('id, tenant_id, brand_name, integration_secret_hash')
            .eq('tenant_id', payload.tenantId)
            .single();

        if (tenantError || !tenantRow) {
            return res.status(401).json({ error: 'Tenant no válido' });
        }

        if (!tenantRow.integration_secret_hash) {
            return res.status(403).json({ error: 'Tenant sin secreto de integración configurado' });
        }

        const providedSecretHash = hashSecret(tenantSecret);
        if (providedSecretHash !== tenantRow.integration_secret_hash) {
            return res.status(401).json({ error: 'Credenciales de integración no válidas' });
        }

        const expiresAt = new Date(
            Date.now() + payload.expiresInHours * 60 * 60 * 1000
        ).toISOString();
        const token = `nkt_${randomBytes(24).toString('hex')}`;

        const { error: insertError } = await supabase
            .from('tokens')
            .insert({
                token,
                tenant_id: tenantRow.id,
                brand_name: tenantRow.brand_name,
                item_name: payload.itemName || null,
                item_image_url: payload.itemImageUrl || null,
                customer_email: payload.customerEmail || null,
                is_used: false,
                expires_at: expiresAt,
            });

        if (insertError) {
            console.error('[b2b/create-token] Supabase insert error:', insertError);
            return res.status(500).json({ error: 'No se pudo emitir el token' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const url = `${frontendUrl.replace(/\/$/, '')}/?token=${encodeURIComponent(token)}`;

        return res.status(201).json({
            ok: true,
            token,
            url,
            expiresAt,
        });
    } catch (error) {
        console.error('[b2b/create-token] Unexpected error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function normalizePayload(payload: CreateTokenPayload): Required<CreateTokenPayload> {
    const requestedExpiry = Number(payload.expiresInHours || DEFAULT_EXPIRY_HOURS);

    return {
        tenantId: normalizeText(payload.tenantId, 120),
        itemName: normalizeText(payload.itemName, 240),
        itemImageUrl: normalizeText(payload.itemImageUrl, 500),
        customerEmail: normalizeText(payload.customerEmail, 160).toLowerCase(),
        expiresInHours: normalizeExpiryHours(requestedExpiry),
    };
}

function normalizeText(value: string | undefined, maxLength: number): string {
    return (value || '').trim().slice(0, maxLength);
}

function normalizeExpiryHours(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return DEFAULT_EXPIRY_HOURS;
    }

    return Math.min(Math.round(value), MAX_EXPIRY_HOURS);
}

function hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
}

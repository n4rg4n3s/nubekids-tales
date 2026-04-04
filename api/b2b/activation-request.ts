import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type PreferredContact = 'whatsapp' | 'email';
type CatalogType = 'fashion' | 'shoes' | 'toys' | 'mixed' | 'other';
type PlanInterest = 'standard' | 'premium' | 'undecided';

interface ActivationRequestPayload {
    contactName?: string;
    businessName?: string;
    businessUrl?: string;
    email?: string;
    whatsapp?: string;
    preferredContact?: PreferredContact;
    catalogType?: CatalogType;
    planInterest?: PlanInterest;
    monthlyOrdersBand?: string;
    notes?: string;
    landingPath?: string;
}

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PREFERRED_CONTACTS = new Set<PreferredContact>(['whatsapp', 'email']);
const CATALOG_TYPES = new Set<CatalogType>(['fashion', 'shoes', 'toys', 'mixed', 'other']);
const PLAN_INTERESTS = new Set<PlanInterest>(['standard', 'premium', 'undecided']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = normalizePayload(req.body as ActivationRequestPayload);
        const validationError = validatePayload(payload);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const { error } = await supabase
            .from('b2b_activation_requests')
            .insert({
                contact_name: payload.contactName,
                business_name: payload.businessName,
                business_url: payload.businessUrl || null,
                email: payload.email,
                whatsapp: payload.whatsapp || null,
                preferred_contact: payload.preferredContact,
                catalog_type: payload.catalogType,
                plan_interest: payload.planInterest,
                monthly_orders_band: payload.monthlyOrdersBand || null,
                notes: payload.notes || null,
                landing_path: payload.landingPath || req.headers.referer || null,
                user_agent: req.headers['user-agent'] || null,
            });

        if (error) {
            console.error('[b2b/activation-request] Supabase error:', error);
            return res.status(500).json({ error: 'No se pudo guardar la solicitud' });
        }

        return res.status(201).json({
            ok: true,
            message: 'Solicitud recibida. Revisaremos tu tienda y te contactaremos pronto.',
        });
    } catch (error) {
        console.error('[b2b/activation-request] Unexpected error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function normalizePayload(body: ActivationRequestPayload): Required<ActivationRequestPayload> {
    return {
        contactName: normalizeText(body.contactName, 120),
        businessName: normalizeText(body.businessName, 160),
        businessUrl: normalizeText(body.businessUrl, 240),
        email: normalizeText(body.email, 160).toLowerCase(),
        whatsapp: normalizeText(body.whatsapp, 40),
        preferredContact: (body.preferredContact || 'email') as PreferredContact,
        catalogType: (body.catalogType || 'mixed') as CatalogType,
        planInterest: (body.planInterest || 'undecided') as PlanInterest,
        monthlyOrdersBand: normalizeText(body.monthlyOrdersBand, 80),
        notes: normalizeText(body.notes, 800),
        landingPath: normalizeText(body.landingPath, 240),
    };
}

function validatePayload(payload: Required<ActivationRequestPayload>): string | null {
    if (!payload.contactName) return 'El nombre de contacto es obligatorio';
    if (!payload.businessName) return 'El nombre de la tienda es obligatorio';
    if (!payload.email || !EMAIL_REGEX.test(payload.email)) return 'Introduce un email válido';
    if (!PREFERRED_CONTACTS.has(payload.preferredContact)) return 'Canal de contacto no válido';
    if (!CATALOG_TYPES.has(payload.catalogType)) return 'Tipo de catálogo no válido';
    if (!PLAN_INTERESTS.has(payload.planInterest)) return 'Plan no válido';

    if (payload.preferredContact === 'whatsapp' && !payload.whatsapp) {
        return 'Si prefieres WhatsApp, necesitamos tu número';
    }

    return null;
}

function normalizeText(value: string | undefined, maxLength: number): string {
    return (value || '').trim().slice(0, maxLength);
}

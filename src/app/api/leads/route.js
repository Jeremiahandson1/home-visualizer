import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyContractorNewLead, sendHomeownerConfirmation } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      tenantSlug, name, email, phone, address, notes,
      projectType, materialId, materialName, materialBrand,
      originalPhotoUrl, generatedPhotoUrl,
      utm, referrer,
      abVariants,
    } = body;

    if (!tenantSlug || !name || !email || !projectType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 2. Store lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        name,
        email,
        phone: phone || '',
        address: address || '',
        notes: notes || '',
        project_type: projectType,
        material_id: materialId || null,
        material_name: materialName || null,
        material_brand: materialBrand || null,
        original_photo_url: originalPhotoUrl || null,
        generated_photo_url: generatedPhotoUrl || null,
        status: 'new',
        utm: { ...(utm || {}), ...(abVariants ? { ab: abVariants } : {}) },
        referrer: referrer || '',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Failed to store lead:', leadError);
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    // 3. Send email notifications (non-blocking)
    const emailPromises = [];

    // Create a share URL for the design if we have generated photos
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://buildprovision.com';
    let designUrl = null;
    if (generatedPhotoUrl) {
      try {
        const { data: shareData } = await supabase
          .from('shares')
          .insert({
            tenant_id: tenant.id,
            original_photo_url: originalPhotoUrl,
            generated_photo_url: generatedPhotoUrl,
            project_type: projectType,
            material_brand: materialBrand || '',
            material_name: materialName || '',
          })
          .select('id')
          .single();
        if (shareData) designUrl = baseUrl + '/share/' + shareData.id;
      } catch (e) { /* non-fatal */ }
    }

    // Notify contractor
    if (tenant.email || tenant.lead_notify_email) {
      emailPromises.push(
        notifyContractorNewLead({
          contractorEmail: tenant.lead_notify_email || tenant.email,
          contractorName: tenant.company_name,
          lead: { name, email, phone, address, materialBrand, materialName },
          designUrl,
        }).then(() => ({ to: 'contractor', ok: true }))
         .catch(err => { console.error('Contractor email failed:', err); return { to: 'contractor', ok: false, error: err.message }; })
      );
    }

    // Confirm to homeowner
    if (email) {
      emailPromises.push(
        sendHomeownerConfirmation({
          homeownerEmail: email,
          homeownerName: name,
          contractorName: tenant.company_name,
          contractorPhone: tenant.phone || '',
          designUrl,
        }).then(() => ({ to: 'homeowner', ok: true }))
         .catch(err => { console.error('Homeowner email failed:', err); return { to: 'homeowner', ok: false, error: err.message }; })
      );
    }

    // 4. CRM webhook (non-blocking, validated)
    if (tenant.crm_webhook_url) {
      let isValidWebhook = false;
      try {
        const webhookUrl = new URL(tenant.crm_webhook_url);
        isValidWebhook = webhookUrl.protocol === 'https:';
      } catch { /* invalid URL */ }

      if (isValidWebhook) emailPromises.push(
        fetch(tenant.crm_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            source: 'twomiah-vision',
            tenant: tenant.slug,
            lead: {
              name, email, phone, address, notes,
              project_type: projectType,
              material: materialName,
              brand: materialBrand,
              original_photo: originalPhotoUrl,
              generated_photo: generatedPhotoUrl,
              design_url: designUrl,
              created_at: lead.created_at,
            },
            utm: utm || {},
            referrer: referrer || '',
          }),
        }).catch(err => console.error('CRM webhook failed:', err))
      );
    }

    // Await emails/webhooks before responding
    const emailResults = await Promise.allSettled(emailPromises);
    const notifications = emailResults
      .map(r => r.status === 'fulfilled' ? r.value : { ok: false, error: 'unknown' })
      .filter(Boolean);

    const allNotificationsOk = notifications.every(n => n.ok);

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      notificationsDelivered: allNotificationsOk,
      ...(allNotificationsOk ? {} : { notificationWarning: 'Some notifications may not have been delivered. The contractor has been alerted.' }),
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead' },
      { status: 500 }
    );
  }
}

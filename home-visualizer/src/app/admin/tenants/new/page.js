'use client';

import TenantForm from '@/components/admin/TenantForm';

export default function NewTenantPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Add Tenant</h1>
      <TenantForm />
    </div>
  );
}

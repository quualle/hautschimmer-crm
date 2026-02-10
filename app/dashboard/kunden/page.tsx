'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { SearchInput } from '@/components/ui/search-input';
import { CustomerForm } from './components/customer-form';
import { CustomerList } from './components/customer-list';
import { TreatmentLogModal } from './components/treatment-log-modal';
import type { CustomerSearchResult } from '@/lib/types';

export default function KundenPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new');
  const [editCustomer, setEditCustomer] = useState<CustomerSearchResult | null>(null);
  const [treatmentCustomer, setTreatmentCustomer] = useState<CustomerSearchResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditCustomer(null);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (customer: CustomerSearchResult) => {
    setEditCustomer(customer);
    setShowForm(true);
  };

  const handleLogTreatment = (customer: CustomerSearchResult) => {
    setTreatmentCustomer(customer);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditCustomer(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Kundinnen
        </h1>
        <Button
          onClick={() => {
            setEditCustomer(null);
            setShowForm(true);
          }}
        >
          <svg
            className="mr-1.5 -ml-0.5"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Neue Kundin
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          onChange={setQuery}
          placeholder="Name, Telefon oder E-Mail suchen..."
          debounceMs={400}
        />
      </div>

      <Card padding="sm" className="overflow-hidden">
        <CustomerList
          query={query}
          onEdit={handleEdit}
          onLogTreatment={handleLogTreatment}
          refreshKey={refreshKey}
        />
      </Card>

      {/* New / Edit Customer Modal */}
      <Modal
        open={showForm}
        onClose={handleCloseForm}
        title={editCustomer ? 'Kundin bearbeiten' : 'Neue Kundin'}
        size="lg"
      >
        <CustomerForm
          customer={editCustomer}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseForm}
        />
      </Modal>

      {/* Treatment Log Modal */}
      {treatmentCustomer && (
        <TreatmentLogModal
          open={!!treatmentCustomer}
          onClose={() => {
            setTreatmentCustomer(null);
            setRefreshKey((k) => k + 1);
          }}
          customerId={treatmentCustomer.id}
          customerName={`${treatmentCustomer.first_name} ${treatmentCustomer.last_name}`}
        />
      )}
    </div>
  );
}

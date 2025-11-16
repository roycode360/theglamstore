import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  LIST_DELIVERY_LOCATIONS,
  UPSERT_DELIVERY_LOCATION,
  DELETE_DELIVERY_LOCATION,
} from '../../graphql/delivery';
import Input from '../ui/Input';
import { useToast } from '../ui/Toast';
import Checkbox from '../ui/Checkbox';
import { Skeleton } from '../ui/Skeleton';

type DeliveryLocationsSectionProps = {
  open: boolean;
  onToggle: () => void;
};

export default function DeliveryLocationsSection({
  open,
  onToggle,
}: DeliveryLocationsSectionProps) {
  const { data, loading, refetch } = useQuery(LIST_DELIVERY_LOCATIONS, {
    fetchPolicy: 'cache-and-network',
  });
  const [upsert] = useMutation(UPSERT_DELIVERY_LOCATION);
  const [del] = useMutation(DELETE_DELIVERY_LOCATION);
  const { showToast } = useToast();

  const rows = useMemo(() => data?.listDeliveryLocations ?? [], [data]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPrice('');
    setActive(true);
    setIsDefault(rows.length === 0);
    setModalOpen(true);
  };
  const openEdit = (row: any) => {
    setEditing(row);
    setName(row.name || '');
    setPrice(String(row.price ?? ''));
    setActive(Boolean(row.active));
    setIsDefault(Boolean(row.isDefault));
    setModalOpen(true);
  };
  const close = () => {
    setModalOpen(false);
    setIsDefault(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (price.trim() === '' || Number.isNaN(Number(price))) {
      showToast('Enter a valid price', 'error');
      return;
    }
    try {
      setSaving(true);
      await upsert({
        variables: {
          input: {
            _id: editing?._id,
            name: name.trim(),
            price: Number(price),
            active,
            isDefault,
          },
        },
        refetchQueries: [{ query: LIST_DELIVERY_LOCATIONS }],
      });
      showToast(editing ? 'Location updated' : 'Location created', 'success');
      setModalOpen(false);
    } catch (e: any) {
      showToast(e?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Delete ${row.name}?`)) return;
    try {
      await del({
        variables: { id: row._id },
        refetchQueries: [{ query: LIST_DELIVERY_LOCATIONS }],
      });
      showToast('Location deleted', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Delete failed', 'error');
    }
  };

  const handleSetDefault = async (row: any) => {
    try {
      await upsert({
        variables: {
          input: {
            _id: row._id,
            name: row.name,
            price: row.price,
            active: row.active,
            isDefault: true,
          },
        },
        refetchQueries: [{ query: LIST_DELIVERY_LOCATIONS }],
      });
      showToast(`${row.name} set as default`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Unable to update default', 'error');
    }
  };

  return (
    <section className="border rounded-xl border-neutral-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="text-sm font-semibold text-neutral-900">
          Delivery locations
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 px-3 text-xs font-medium border rounded-md border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            onClick={openCreate}
          >
            Add location
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="inline-flex items-center justify-center w-8 h-8 border rounded-md border-neutral-200 hover:bg-neutral-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${open ? 'block' : 'hidden'}`}>
        {loading ? (
          <DeliveryLocationsSkeleton />
        ) : rows.length === 0 ? (
          <div
            className="p-4 m-4 text-sm bg-white border border-dashed rounded-lg border-neutral-200"
            style={{ color: 'rgb(var(--muted))' }}
          >
            No delivery locations yet.
          </div>
        ) : (
          <div className="m-4 overflow-hidden border rounded-lg border-neutral-200">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr className="text-left">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row: any) => (
                  <tr key={row._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                        {row.isDefault ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            Default
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      ₦{Number(row.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{row.active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      {row.isDefault ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="h-8 px-3 mx-1 text-sm rounded-md btn-ghost"
                        onClick={() => handleSetDefault(row)}
                        disabled={row.isDefault}
                      >
                        {row.isDefault ? 'Default' : 'Set default'}
                      </button>
                      <button
                        className="h-8 px-3 mx-1 text-sm rounded-md btn-ghost"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="h-8 px-3 mx-1 text-sm text-red-600 rounded-md btn-ghost"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-lg">
            <div className="mb-3 text-lg font-semibold">
              {editing ? 'Edit delivery location' : 'Add delivery location'}
            </div>
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-sm font-medium">Name</div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lagos"
                />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Price (₦)</div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 2000"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  className="mx-2"
                  label="Active"
                  checked={active}
                  onChange={(value) => setActive(value)}
                />
                <Checkbox
                  className="mx-2"
                  label="Set as default location"
                  checked={isDefault}
                  onChange={(value) => setIsDefault(value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                className="px-3 rounded-md btn-ghost h-9"
                onClick={close}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 rounded-md btn-primary h-9"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DeliveryLocationsSkeleton() {
  const rows = Array.from({ length: 4 });
  return (
    <div className="m-4 space-y-4">
      <div className="rounded-lg border border-dashed border-neutral-200">
        <div className="grid grid-cols-[2fr_1fr_auto_auto_auto] items-center gap-4 border-b border-neutral-200 px-4 py-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full justify-self-end" />
        </div>
        <div className="divide-y divide-neutral-200">
          {rows.map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[2fr_1fr_auto_auto_auto] items-center gap-4 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-5 w-10 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

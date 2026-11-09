'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import {
  createReadyStock,
  updateReadyStock,
} from '@/app/admin/(protected)/ready-stock/actions';
import Field, { inputClass } from '@/components/admin/Field';
import MediaInput from '@/components/admin/MediaInput';
import SubmitButton from '@/components/admin/SubmitButton';

export interface ReadyStockFormItem {
  id: string;
  code: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  priceMyr: number;
  sizeLabel: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  status: 'available' | 'sold';
}

const SIZE_PRESETS = ['Small', 'Medium', 'Large'];

export default function ReadyStockForm({ item }: { item?: ReadyStockFormItem }) {
  const editing = Boolean(item);
  const [state, formAction] = useFormState(editing ? updateReadyStock : createReadyStock, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      {item ? (
        <p className="text-sm text-ink-soft">
          Code <span className="font-semibold text-ink">{item.code}</span> (shown to customers and in WhatsApp orders)
        </p>
      ) : null}

      <MediaInput
        initialUrl={item?.imageUrl}
        initialPublicId={item?.cloudinaryPublicId}
        error={errors.imageUrl}
      />

      <Field label="Name" htmlFor="name" error={errors.name}>
        <input id="name" name="name" required maxLength={120} defaultValue={item?.name} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Price (RM)" htmlFor="priceMyr" hint="For example 180 or 180.50" error={errors.priceMyr}>
          <input
            id="priceMyr"
            name="priceMyr"
            inputMode="decimal"
            required
            defaultValue={item ? String(item.priceMyr) : ''}
            className={inputClass}
          />
        </Field>
        <Field label="Size" htmlFor="sizeLabel" hint="Leave empty for one size" error={errors.sizeLabel}>
          <input
            id="sizeLabel"
            name="sizeLabel"
            list="size-presets"
            maxLength={40}
            defaultValue={item?.sizeLabel}
            className={inputClass}
          />
          <datalist id="size-presets">
            {SIZE_PRESETS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Description (English)" htmlFor="descriptionEn" hint="Optional" error={errors.descriptionEn}>
        <textarea id="descriptionEn" name="descriptionEn" rows={3} maxLength={1000} defaultValue={item?.descriptionEn} className={inputClass} />
      </Field>
      <Field label="Description (Bahasa Melayu)" htmlFor="descriptionMs" hint="Optional" error={errors.descriptionMs}>
        <textarea id="descriptionMs" name="descriptionMs" rows={3} maxLength={1000} defaultValue={item?.descriptionMs} className={inputClass} />
      </Field>

      {item ? (
        <Field label="Status" htmlFor="status" hint="Sold bags disappear from the public site." error={errors.status}>
          <select id="status" name="status" defaultValue={item.status} className={inputClass}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </Field>
      ) : null}

      {state?.error && Object.keys(errors).length === 0 ? (
        <p role="alert" className="text-sm text-maroon">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <SubmitButton>{editing ? 'Save changes' : 'Add bag'}</SubmitButton>
        <Link
          href="/admin/ready-stock"
          className="inline-flex items-center border border-ink px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-warm-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

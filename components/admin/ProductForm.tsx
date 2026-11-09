'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { createProduct, deleteProduct, updateProduct } from '@/app/admin/(protected)/products/actions';
import { ASPECT_CLASS_OPTIONS, GRID_CLASS_OPTIONS } from '@/lib/admin/schemas';
import Field, { inputClass } from '@/components/admin/Field';
import MediaInput from '@/components/admin/MediaInput';
import SizesEditor, { type SizeDraft } from '@/components/admin/SizesEditor';
import SubmitButton from '@/components/admin/SubmitButton';

export interface ProductFormItem {
  id: string;
  name: string;
  descriptionEn: string;
  descriptionMs: string;
  priceMyr: number;
  imageUrl: string;
  cloudinaryPublicId: string;
  bg: string;
  gridClass: string;
  aspectClass: string;
  sortOrder: number;
  isPublished: boolean;
  /** One "Label: value" per line. */
  detailsText: string;
  sizes: SizeDraft[];
}

export default function ProductForm({ product }: { product?: ProductFormItem }) {
  const editing = Boolean(product);
  const [state, formAction] = useFormState(editing ? updateProduct : createProduct, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <MediaInput
        initialUrl={product?.imageUrl}
        initialPublicId={product?.cloudinaryPublicId}
        error={errors.imageUrl}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field
          label="ID"
          htmlFor="id"
          hint={editing ? 'The ID cannot be changed.' : 'Used in the page address, e.g. senja-tote'}
          error={errors.id}
        >
          <input
            id="id"
            name="id"
            required
            maxLength={60}
            defaultValue={product?.id}
            readOnly={editing}
            className={`${inputClass} ${editing ? 'bg-sand text-ink-soft' : ''}`}
          />
        </Field>
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input id="name" name="name" required maxLength={120} defaultValue={product?.name} className={inputClass} />
        </Field>
      </div>

      <Field label="Description (English)" htmlFor="descriptionEn" error={errors.descriptionEn}>
        <textarea id="descriptionEn" name="descriptionEn" rows={3} required maxLength={500} defaultValue={product?.descriptionEn} className={inputClass} />
      </Field>
      <Field label="Description (Bahasa Melayu)" htmlFor="descriptionMs" error={errors.descriptionMs}>
        <textarea id="descriptionMs" name="descriptionMs" rows={3} required maxLength={500} defaultValue={product?.descriptionMs} className={inputClass} />
      </Field>

      <Field label="Price (RM)" htmlFor="priceMyr" hint="For example 480 or 480.50" error={errors.priceMyr}>
        <input
          id="priceMyr"
          name="priceMyr"
          inputMode="decimal"
          required
          defaultValue={product ? String(product.priceMyr) : ''}
          className={`${inputClass} !w-48`}
        />
      </Field>

      <SizesEditor initial={product?.sizes ?? []} error={errors.sizes} />

      <Field
        label="Details"
        htmlFor="details"
        hint="Optional. One per line, like “Material: Terengganu batik”. Only add facts you have confirmed."
        error={errors.details}
      >
        <textarea id="details" name="details" rows={4} maxLength={2000} defaultValue={product?.detailsText} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Field label="Card width" htmlFor="gridClass" error={errors.gridClass}>
          <select id="gridClass" name="gridClass" defaultValue={product?.gridClass ?? GRID_CLASS_OPTIONS[1].value} className={inputClass}>
            {GRID_CLASS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Image shape" htmlFor="aspectClass" error={errors.aspectClass}>
          <select id="aspectClass" name="aspectClass" defaultValue={product?.aspectClass ?? ASPECT_CLASS_OPTIONS[0].value} className={inputClass}>
            {ASPECT_CLASS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Order" htmlFor="sortOrder" hint="Lower numbers come first" error={errors.sortOrder}>
          <input id="sortOrder" name="sortOrder" inputMode="numeric" defaultValue={String(product?.sortOrder ?? 0)} className={inputClass} />
        </Field>
      </div>

      <input type="hidden" name="bg" value={product?.bg ?? '#8B3A3A'} />

      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="isPublished" defaultChecked={product?.isPublished ?? true} className="h-4 w-4 accent-maroon" />
        Published (visible on the public site)
      </label>

      {state?.error && Object.keys(errors).length === 0 ? (
        <p role="alert" className="text-sm text-maroon">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <SubmitButton>{editing ? 'Save changes' : 'Create product'}</SubmitButton>
        <Link
          href="/admin/products"
          className="inline-flex items-center border border-ink px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-warm-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Separate form (forms cannot be nested) so deleting never submits the edit form. */
export function DeleteProductForm({ id, name }: { id: string; name: string }) {
  const [state, action] = useFormState(deleteProduct, null);
  return (
    <form action={action} className="border-t border-ink/60 pt-6 max-w-2xl">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-ink-soft mb-3">
        Deleting a product also removes its sizes. This cannot be undone. To hide it temporarily, untick “Published”.
      </p>
      <SubmitButton variant="danger" confirmMessage={`Delete “${name}” and all of its sizes? This cannot be undone.`}>
        Delete product
      </SubmitButton>
      {state?.error ? <p role="alert" className="mt-2 text-sm text-maroon">{state.error}</p> : null}
    </form>
  );
}

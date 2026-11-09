import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-medium">Add pre-order product</h1>
      <ProductForm />
    </div>
  );
}

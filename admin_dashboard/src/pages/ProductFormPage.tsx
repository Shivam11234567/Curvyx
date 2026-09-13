import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProductsApi } from "@/api/products";
import { adminCategoriesApi } from "@/api/categories";
import { formatCurrency } from "@/utils";
import { ArrowLeft, Plus, Trash2, Upload, Star, Check, Loader2 } from "lucide-react";

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    mrp: "",
    selling_price: "",
    description: "",
    product_details: "",
    material: "",
    care_instructions: "",
    is_active: true,
    is_featured: false,
  });

  const [newVariant, setNewVariant] = useState({
    sku: "",
    size: "34B",
    color: "Midnight Black",
    color_code: "#111827",
    price: "",
    stock_quantity: 20,
    is_active: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCategoriesApi.list(),
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => adminProductsApi.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug,
        category_id: product.category_id,
        mrp: product.mrp.toString(),
        selling_price: product.selling_price.toString(),
        description: product.description || "",
        product_details: product.product_details || "",
        material: product.material || "",
        care_instructions: product.care_instructions || "",
        is_active: product.is_active,
        is_featured: product.is_featured,
      });
      setNewVariant((prev) => ({
        ...prev,
        price: product.selling_price.toString(),
      }));
    } else if (categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }));
    }
  }, [product, categories]);

  const saveProductMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return adminProductsApi.update(id!, data);
      } else {
        return adminProductsApi.create({
          ...data,
          variants: [
            {
              sku: `${data.name.slice(0, 3).toUpperCase()}-34B-BLK`,
              size: "34B",
              color: "Midnight Black",
              price: Number(data.selling_price),
              stock_quantity: 25,
              is_active: true,
            },
          ],
        });
      }
    },
    onSuccess: (savedProd) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      if (!isEditing) {
        navigate(`/products/${savedProd.id}`);
      } else {
        alert("Product saved successfully!");
      }
    },
    onError: (err: any) => setError(err.message || "Failed to save product"),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isEditing) return;
    setUploadingImage(true);
    try {
      await adminProductsApi.uploadImage(id!, file);
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) {
      alert(err.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImageMutation = useMutation({
    mutationFn: (imgId: string) => adminProductsApi.deleteImage(imgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const addVariantMutation = useMutation({
    mutationFn: (variant: any) =>
      adminProductsApi.addVariant(id!, {
        ...variant,
        price: Number(variant.price || formData.selling_price),
        stock_quantity: Number(variant.stock_quantity),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setNewVariant({
        sku: "",
        size: "34B",
        color: "Midnight Black",
        color_code: "#111827",
        price: formData.selling_price,
        stock_quantity: 20,
        is_active: true,
      });
    },
    onError: (err: any) => alert(err.message || "Failed to add variant"),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) => adminProductsApi.deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.mrp || !formData.selling_price) {
      alert("Please fill all required fields");
      return;
    }
    saveProductMutation.mutate({
      ...formData,
      mrp: Number(formData.mrp),
      selling_price: Number(formData.selling_price),
    });
  };

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading product editor...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? `Edit: ${product?.name}` : "Create New Product"}
            </h1>
            <p className="text-xs text-slate-500">Configure catalog properties, pricing, and variants</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. CloudSoft Everyday Bra"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                aria-label="Product Category"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="999.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                placeholder="799.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
              Description & Summary
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Material Composition
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="92% Combed Cotton, 8% Elastane"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Care Instructions
              </label>
              <input
                type="text"
                value={formData.care_instructions}
                onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                placeholder="Hand wash cold or gentle machine cycle"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Published & Visible on Website</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saveProductMutation.isPending}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              {isEditing ? "Update Product Details" : "Create Product & Continue"}
            </button>
          </div>
        </div>
      </form>

      {isEditing && product && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Product Image Gallery
              </h2>
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg uppercase transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? "Uploading..." : "Upload Photo"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full uppercase">
                      Primary
                    </span>
                  )}
                  <button
                    onClick={() => deleteImageMutation.mutate(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Variant Matrix (Sizes & Colors)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Color</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.variants.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2.5 font-mono font-bold text-slate-900">{v.sku}</td>
                      <td className="py-2.5 font-bold text-slate-800">{v.size}</td>
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: v.color_code || "#111827" }}
                        />
                        <span>{v.color}</span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 font-sans">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">{v.stock_quantity} units</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => deleteVariantMutation.mutate(v.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Delete variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Add Variant
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <input
                  type="text"
                  placeholder="SKU *"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Size (e.g. 34B) *"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Color Name *"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="number"
                  placeholder="Initial Stock"
                  value={newVariant.stock_quantity}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, stock_quantity: Number(e.target.value) })
                  }
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newVariant.sku || !newVariant.size || !newVariant.color) {
                      alert("Please provide SKU, size, and color");
                      return;
                    }
                    addVariantMutation.mutate(newVariant);
                  }}
                  disabled={addVariantMutation.isPending}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

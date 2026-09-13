"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressesApi } from "@/lib/api/addresses";
import { useAuth } from "@/features/auth/AuthContext";
import { User, MapPin, Package, LogOut, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: !!user,
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: typeof newAddress) => addressesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setIsAddingAddress(false);
      setNewAddress({
        name: "",
        phone: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Sign in to Access Your Account</h1>
        <button
          onClick={() => router.push("/login?redirect=/account")}
          className="px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-rose-100">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">My Account</h1>
          <p className="text-xs text-neutral-500 mt-1">Manage profile, addresses, and view order history</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/account/orders"
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full uppercase tracking-wider transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>My Orders</span>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-full uppercase tracking-wider transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
            <div className="p-2.5 rounded-full bg-rose-100 text-rose-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-neutral-900">Profile Details</h2>
              <span className="text-[11px] text-neutral-500">Verified Member</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-400 block uppercase font-bold text-[10px]">Name</span>
              <span className="font-semibold text-neutral-900 text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-neutral-400 block uppercase font-bold text-[10px]">Email</span>
              <span className="font-semibold text-neutral-900">{user.email}</span>
            </div>
            {user.phone && (
              <div>
                <span className="text-neutral-400 block uppercase font-bold text-[10px]">Phone</span>
                <span className="font-semibold text-neutral-900">{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h2 className="font-serif text-base font-bold text-neutral-900">Saved Addresses</h2>
            </div>
            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {isAddingAddress && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAddressMutation.mutate(newAddress);
              }}
              className="p-4 bg-rose-50/40 rounded-xl border border-rose-200/80 space-y-3"
            >
              <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                New Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number *"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Address Line 1 *"
                value={newAddress.address_line_1}
                onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={newAddress.address_line_2}
                onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="City *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="State *"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN Code *"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAddressMutation.isPending}
                  className="px-5 py-1.5 bg-rose-600 text-white text-xs font-semibold uppercase rounded-full"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-xl border border-neutral-200 bg-white relative space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">{addr.name}</span>
                  {addr.is_default && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600">{addr.phone}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {addr.address_line_1}
                  {addr.address_line_2 && `, ${addr.address_line_2}`}, {addr.city}, {addr.state} -{" "}
                  {addr.postal_code}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => deleteAddressMutation.mutate(addr.id)}
                    className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

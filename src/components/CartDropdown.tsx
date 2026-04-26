"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePriceCents: number;
    imageUrl: string | null;
    category: {
      name: string;
    };
  };
  variant: {
    id: string;
    name: string;
    canvasSize: string;
    frameStyle: string;
    priceCents: number;
  } | null;
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CartDropdown() {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchCart();
    }
  }, [session]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 bg-[#f8f1e6] text-[#1a1614] px-3 py-2 rounded-lg hover:bg-[#eadfcb] transition-colors"
      >
        <ShoppingCart className="w-4 h-4" />
        <span className="text-sm font-medium">Cart</span>
        {cart && cart.itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#d4a574] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cart.itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-[#eadfcb] z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-[#eadfcb]">
            <h3 className="text-lg font-semibold text-[#1a1614]">Shopping Cart</h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {!cart || cart.items.length === 0 ? (
              <div className="p-4 text-center text-[#6b5d54]">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
                <Link
                  href="/products"
                  className="text-[#d4a574] hover:underline text-sm mt-1 inline-block"
                  onClick={() => setIsOpen(false)}
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="p-2">
                {cart.items.map((item) => {
                  const itemTotal = (item.product.basePriceCents + (item.variant?.priceCents || 0)) * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-3 p-3 border-b border-[#f8f1e6] last:border-b-0">
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100"}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#1a1614] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-[#6b5d54]">
                          {item.variant ? item.variant.name : "Standard"}
                        </p>
                        <p className="text-xs text-[#6b5d54]">
                          {formatPrice(itemTotal)}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="w-6 h-6 flex items-center justify-center bg-[#f8f1e6] rounded hover:bg-[#eadfcb] disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading}
                            className="w-6 h-6 flex items-center justify-center bg-[#f8f1e6] rounded hover:bg-[#eadfcb] disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={loading}
                            className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-[#eadfcb]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-[#1a1614]">Total:</span>
                <span className="font-bold text-lg text-[#1a1614]">
                  {formatPrice(cart.total)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="w-full bg-[#1a1614] text-white py-2 px-4 rounded-lg hover:bg-[#2a2624] transition-colors text-center block font-semibold"
              >
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
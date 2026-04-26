import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import CartDropdown from "@/components/CartDropdown";
import prisma from "@/lib/prisma";
import { ShoppingCart, ArrowRight, Trash2, Plus, Minus } from "lucide-react";

async function getCartItems(userId: string) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
        variant: true,
      },
    });
    return cartItems;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
}

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const cartItems = await getCartItems(session.user.id);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
  const shipping = subtotal > 5000 ? 0 : 995; // Free shipping over $50
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1614] mb-2">Shopping Cart</h1>
          <p className="text-[#6b5d54]">
            {cartItems.length === 0
              ? "Your cart is empty"
              : `${cartItems.length} item${cartItems.length === 1 ? "" : "s"} in your cart`
            }
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-[#6b5d54] mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-[#1a1614] mb-2">
              Your cart is empty
            </h2>
            <p className="text-[#6b5d54] mb-6">
              Add some beautiful paintings to your cart to get started.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1a1614] text-white px-6 py-3 rounded-lg hover:bg-[#2a2624] transition-colors font-semibold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.product?.imageUrl || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200"}
                        alt={item.product?.name || "Product"}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#1a1614] mb-1">
                          {item.product?.name || "Custom Order"}
                        </h3>
                        <p className="text-sm text-[#6b5d54] mb-2">
                          {item.variant ? item.variant.name : "Standard"}
                        </p>
                        <p className="text-sm text-[#6b5d54] mb-3">
                          {item.product?.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button className="w-8 h-8 bg-[#f8f1e6] rounded-full flex items-center justify-center hover:bg-[#eadfcb] transition-colors">
                              <Minus className="w-4 h-4 text-[#1a1614]" />
                            </button>
                            <span className="w-8 text-center font-semibold text-[#1a1614]">
                              {item.quantity}
                            </span>
                            <button className="w-8 h-8 bg-[#f8f1e6] rounded-full flex items-center justify-center hover:bg-[#eadfcb] transition-colors">
                              <Plus className="w-4 h-4 text-[#1a1614]" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-[#1a1614]">
                              {formatPrice(item.totalPriceCents)}
                            </p>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium mt-1">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)] sticky top-6">
                <h2 className="text-xl font-semibold text-[#1a1614] mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[#6b5d54]">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#6b5d54]">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                  </div>

                  <div className="flex justify-between text-[#6b5d54]">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>

                  <div className="border-t border-[#eadfcb] pt-3">
                    <div className="flex justify-between text-lg font-bold text-[#1a1614]">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-[#1a1614] text-white px-6 py-3 rounded-lg hover:bg-[#2a2624] transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {subtotal < 5000 && (
                  <p className="text-xs text-[#6b5d54] mt-3 text-center">
                    Add {formatPrice(5000 - subtotal)} more for free shipping
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
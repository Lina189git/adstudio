import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import CartDropdown from "@/components/CartDropdown";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/painting-order", label: "Custom Order" },
  { href: "/painting-order/gallery", label: "Gallery" },
  { href: "/ai-painting", label: "AI Studio (DALL-E)" },
];

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#eadfcb] bg-[#fffaf2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-[0.08em]">
          OIL PAINTING
        </Link>

        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[#6b5d54]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[#eadfcb] px-4 py-2 transition hover:border-[#d4a574] hover:text-[#1a1614]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CartDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

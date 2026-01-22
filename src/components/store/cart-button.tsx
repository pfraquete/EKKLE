'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { CartSidebar } from './cart-sidebar';

export function CartButton() {
  const { totalItems } = useCart();
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setShowCart(true)}
      >
        <ShoppingCart className="w-4 h-4" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Button>

      <CartSidebar isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}

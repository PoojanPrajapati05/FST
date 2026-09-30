"use client";

import { useState, useOptimistic } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/transaction";
import { submitContactAction } from "@/app/actions/contact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface Props {
  products: Product[];
  serverRenderedAt: string;
}

// Optimistic message type
type OptimisticMessage = { text: string; pending: boolean };

export function AssignmentOneClientDemo({ products, serverRenderedAt }: Props) {
  const isMounted = useMounted();

  // ── Cart ─────────────────────────────────────────────────────────────────
  const { items, addItem, removeItem, increaseQuantity, decreaseQuantity, clearCart, totalQuantity, subtotal } =
    useCartStore();

  // ── Optimistic UI for "cart add" feedback ────────────────────────────────
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state: typeof items, newItem: Product) => {
      const existing = state.find((i) => i.id === newItem.id);
      if (existing) {
        return state.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { ...newItem, quantity: 1 }];
    }
  );

  function handleAddToCart(product: Product) {
    addOptimistic(product); // immediate optimistic update
    addItem(product);       // real Zustand update
    toast.success(`"${product.name}" added to cart!`);
  }

  // ── React Hook Form + Zod ────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema), // client-side Zod validation
  });

  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverMsg, setServerMsg] = useState<string>("");

  async function onSubmit(data: ContactFormValues) {
    setFormStatus("idle");
    // Calls the Server Action — validated again on server with same Zod schema
    const result = await submitContactAction(data);
    if (result.success) {
      setFormStatus("success");
      setServerMsg(result.message);
      reset();
      toast.success("Message sent! (Server Action succeeded)");
    } else {
      setFormStatus("error");
      setServerMsg(result.message);
      toast.error(result.message);
    }
  }

  const cartTotal = isMounted ? subtotal() : 0;
  const cartQty = isMounted ? totalQuantity() : 0;

  return (
    <div className="space-y-8">
      {/* HYDRATION NOTE */}
      <Card className="rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            🔄 Hydration Demonstrated
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <p><strong>Server rendered at:</strong> <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{serverRenderedAt}</code></p>
          <p><strong>Client mounted:</strong> <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{isMounted ? "✅ Hydrated" : "⏳ Waiting..."}</code></p>
          <p className="mt-1">The cart below is powered by Zustand with <strong>localStorage persistence</strong>. Refresh the page — items remain!</p>
        </CardContent>
      </Card>

      {/* SHOPPING CART SECTION */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">🛍️ Product Catalog</h2>
            <Badge variant="secondary" className="text-xs">Server → Client Props</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => {
              const inCart = isMounted
                ? optimisticItems.find((i) => i.id === product.id)
                : undefined;
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl text-center">{product.image}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{product.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">₹{product.price}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={inCart ? "secondary" : "default"}
                    className="w-full text-xs h-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {inCart ? `In Cart (×${inCart.quantity})` : "Add to Cart"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-24">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base font-bold">Cart</CardTitle>
                  {cartQty > 0 && (
                    <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {cartQty}
                    </Badge>
                  )}
                </div>
                {cartQty > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-500 hover:text-red-600 h-7"
                    onClick={() => { clearCart(); toast.info("Cart cleared"); }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isMounted ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading cart...</p>
              ) : items.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Your cart is empty. Add some items!</p>
              ) : (
                <>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate text-xs">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">₹{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="h-6 w-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="h-6 w-6 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { removeItem(item.id); toast.info("Item removed"); }}
                          className="h-6 w-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Total ({cartQty} items)</span>
                      <span className="text-blue-600 dark:text-blue-400">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      🔒 Persisted in localStorage via Zustand
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* REACT HOOK FORM + ZOD + SERVER ACTION SECTION */}
      <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold">📋 React Hook Form + Zod + Server Action</CardTitle>
            <Badge variant="outline" className="text-xs">Same Zod schema on client &amp; server</Badge>
          </div>
          <CardDescription>
            Client validation runs instantly via Zod. On submit, the same schema validates again inside a Server Action.
            Try <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">error@test.com</code> to trigger a server error.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formStatus === "success" ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Success!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{serverMsg}</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setFormStatus("idle")}>
                Reset
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
              {formStatus === "error" && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400">
                  <strong>Server Error:</strong> {serverMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="a1-name" className="text-xs font-medium">Name</Label>
                  <Input
                    id="a1-name"
                    placeholder="Your name"
                    {...register("name")}
                    className={errors.name ? "border-red-400" : ""}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="a1-email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="a1-email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={errors.email ? "border-red-400" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="a1-subject" className="text-xs font-medium">Subject</Label>
                <Input
                  id="a1-subject"
                  placeholder="Brief subject line"
                  {...register("subject")}
                  className={errors.subject ? "border-red-400" : ""}
                />
                {errors.subject && (
                  <p className="text-xs text-red-500">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="a1-message" className="text-xs font-medium">Message</Label>
                <textarea
                  id="a1-message"
                  rows={4}
                  placeholder="Your message (min 10 characters)..."
                  {...register("message")}
                  className={`w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.message ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                id="a1-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending... (Loading State)
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit via Server Action
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ZUSTAND STATE INSPECTOR */}
      <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">🐻 Zustand State Inspector</CardTitle>
          <CardDescription>Live view of the cart Zustand store. Open DevTools → Application → localStorage to see persistence.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-[11px] bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-4 overflow-auto max-h-48 font-mono leading-relaxed">
            {isMounted
              ? JSON.stringify(
                  {
                    storeKey: "splitease-cart-storage",
                    items: items.map((i) => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price })),
                    totalQuantity: cartQty,
                    subtotal: `₹${cartTotal.toFixed(2)}`,
                    note: "Persisted to localStorage automatically",
                  },
                  null,
                  2
                )
              : "Hydrating from localStorage..."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

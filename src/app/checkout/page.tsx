import { Suspense } from "react";
import { DodoCheckoutFlow } from "@/components/checkout/dodo-checkout-flow";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading checkout…
        </div>
      }
    >
      <DodoCheckoutFlow />
    </Suspense>
  );
}

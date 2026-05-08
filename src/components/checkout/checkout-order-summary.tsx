"use client";

type BreakdownMoney = Partial<{
  subTotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  finalTotal?: number | null;
  currency?: string | null;
  finalTotalCurrency?: string | null;
}>;

export function CheckoutOrderSummary(props: {
  title: string;
  description?: string | null;
  breakdown: BreakdownMoney;
  refundPolicyHref?: string;
}) {
  const { title, description, breakdown, refundPolicyHref = "/terms" } = props;
  const format = (amt: number | null | undefined, curr: string | null | undefined) =>
    amt != null && curr
      ? `${curr} ${(amt / 100).toFixed(2)}`
      : amt != null && !curr
        ? (amt / 100).toFixed(2)
        : "—";

  const currency = breakdown.currency ?? breakdown.finalTotalCurrency ?? "";
  const total =
    breakdown.finalTotal != null ? breakdown.finalTotal : breakdown.total;

  return (
    <div className="space-y-4 border border-border bg-muted/30 p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Order summary</h2>
        <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2 text-sm">
        {breakdown.subTotal != null ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono tabular-nums">{format(breakdown.subTotal, currency)}</span>
          </div>
        ) : null}
        {breakdown.discount != null && breakdown.discount > 0 ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-mono tabular-nums">{format(breakdown.discount, currency)}</span>
          </div>
        ) : null}
        {breakdown.tax != null ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-mono tabular-nums">{format(breakdown.tax, currency)}</span>
          </div>
        ) : null}
        <hr className="border-border" />
        <div className="flex justify-between gap-4 text-base font-semibold">
          <span>Total</span>
          <span className="font-mono tabular-nums">
            {format(total, breakdown.finalTotalCurrency ?? currency)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Refunds follow our{" "}
        <a href={refundPolicyHref} className="underline underline-offset-2 hover:text-foreground">
          Terms &amp; refund policy
        </a>
        .
      </p>
    </div>
  );
}

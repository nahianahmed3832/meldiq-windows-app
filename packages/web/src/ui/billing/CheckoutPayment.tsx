import { LockKeyhole } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import type { PayPalConfig } from "../../api/paypalSchemas";
import { PayPalButton } from "./PayPalButton";

export function CheckoutPayment({
  config,
  accepted,
  onAccept,
  unavailable,
  payment,
  attempt,
  children,
}: {
  config: PayPalConfig | null;
  accepted: boolean;
  onAccept: (accepted: boolean) => void;
  unavailable: string | null;
  payment: Omit<ComponentProps<typeof PayPalButton>, "config">;
  attempt: number;
  children?: ReactNode;
}) {
  const blocked = config?.environment === "sandbox" && Boolean(window.meldiqDesktop);
  const canPay = config && !blocked && !unavailable;
  return (
    <section className="checkout-card checkout-payment-card" aria-labelledby="checkout-payment-title">
      <div className="checkout-card-heading">
        <h2 id="checkout-payment-title">Payment</h2>
        {config?.environment === "sandbox" && !blocked && <span className="checkout-sandbox">Sandbox</span>}
      </div>
      <p className="checkout-security">
        <LockKeyhole size={15} aria-hidden="true" />
        {config?.environment === "sandbox" && !blocked ? "This is a test purchase. No real money is taken." : "PayPal securely handles your payment details."}
      </p>
      <div className="checkout-method">
        <span className="checkout-radio" aria-hidden="true" />
        <div>
          <strong>PayPal</strong>
          <small>{payment.subscription ? "Authorize recurring payments" : "Authorize a one-time payment"}</small>
        </div>
      </div>
      {canPay && (
        <label className="checkout-agreement">
          <input type="checkbox" checked={accepted} onChange={(event) => onAccept(event.target.checked)} />
          <span>
            I agree to the{" "}
            <a href="https://meldiq.app/legal/terms" target="_blank" rel="noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="https://meldiq.app/legal/billing" target="_blank" rel="noreferrer">
              billing terms
            </a>
            , and have read the{" "}
            <a href="https://meldiq.app/legal/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      )}
      {blocked || unavailable ? (
        <p className="checkout-notice" role="status">
          {blocked ? "Live PayPal checkout is unavailable. Refresh before trying again." : unavailable}
        </p>
      ) : (
        <div className="checkout-express">
          <h3>Express checkout</h3>
          {canPay && accepted ? (
            <PayPalButton key={attempt} config={config} {...payment} />
          ) : (
            <p className="checkout-notice" role="status">
              {config ? "Agree to the terms to continue with PayPal." : "Waiting for PayPal checkout details."}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

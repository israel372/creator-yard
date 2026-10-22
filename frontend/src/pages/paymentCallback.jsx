import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./paymentCallback.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("Confirming your payment...");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkPayment() {
      const reference =
        searchParams.get("reference") ||
        searchParams.get("tx_ref") ||
        searchParams.get("transaction_reference");

      if (!reference) {
        setError("Payment reference was not found.");
        return;
      }

      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const response = await fetch(
            `${API_BASE}/payment/status/${encodeURIComponent(reference)}`
          );

          const data = await response.json();

          if (cancelled) return;

          if (data?.profile_token) {
            setMessage("Payment confirmed. Opening your profile...");

            setTimeout(() => {
              navigate(`/profile/${data.profile_token}`);
            }, 800);

            return;
          }

          if (data?.status === "failed") {
            setError("Your payment was not successful.");
            return;
          }

          setMessage("Payment received. Waiting for confirmation...");

          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (err) {
          if (cancelled) return;

          setError("Unable to confirm your payment. Please try again.");
          return;
        }
      }

      if (!cancelled) {
        setError(
          "Payment confirmation is taking longer than expected. Please refresh this page."
        );
      }
    }

    checkPayment();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <div className="payment-callback">
      <div className="payment-callback-card">
        {error ? (
          <>
            <h1>Payment Status</h1>
            <p>{error}</p>
          </>
        ) : (
          <>
            <div className="payment-spinner"></div>
            <h1>Processing Payment</h1>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentCallback;
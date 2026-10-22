
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./join.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function Join() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");

  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");

  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState(false);
  const [domainMessage, setDomainMessage] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // =========================
  // CHECK REFERRAL
  // =========================

  useEffect(() => {
    if (!code) {
      setChecking(false);
      return;
    }

    fetch(
      `${API_BASE}/referral/check?code=${encodeURIComponent(code)}`
    )
      .then((response) => response.json())
      .then((data) => {
        setValid(data.valid);
        setChecking(false);
      })
      .catch(() => {
        setValid(false);
        setChecking(false);
      });
  }, [code]);

  // =========================
  // CHECK DOMAIN
  // =========================

  useEffect(() => {
    const trimmedDomain = domain.trim().toLowerCase();

    setDomainAvailable(false);
    setDomainMessage("");

    if (!trimmedDomain) {
      setDomainChecking(false);
      return;
    }

    const timer = setTimeout(() => {
      setDomainChecking(true);

      fetch(
        `${API_BASE}/referral/check-domain?domain=${encodeURIComponent(
          trimmedDomain
        )}`
      )
        .then((response) => response.json())
        .then((data) => {
          setDomainAvailable(data.available === true);

          if (data.available === true) {
            setDomainMessage("✓ Domain is available");
          } else {
            setDomainMessage("✕ Domain is not available");
          }

          setDomainChecking(false);
        })
        .catch(() => {
          setDomainAvailable(false);
          setDomainMessage("Unable to check domain");
          setDomainChecking(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [domain]);

  // =========================
  // PAYMENT
  // =========================

  async function handlePayment(event) {
    event.preventDefault();

    console.log("=================================");
    console.log("POWERCHOICE PAYMENT DEBUG");
    console.log("=================================");
    console.log("Payment handler started");
    console.log("API_BASE:", API_BASE);
    console.log("Company name:", companyName);
    console.log("Domain:", domain);
    console.log("Domain available:", domainAvailable);
    console.log("Email:", email);

    // Do NOT print card number, expiry, or CVV.
    console.log("Card number provided:", !!cardNumber.trim());
    console.log("Expiry month provided:", !!expiryMonth.trim());
    console.log("Expiry year provided:", !!expiryYear.trim());
    console.log("CVV provided:", !!cvv.trim());

    setPaymentError("");

    // =========================
    // VALIDATION
    // =========================

    if (!companyName.trim()) {
      console.log("DEBUG: Company name missing");
      setPaymentError("Please enter your company name.");
      return;
    }

    if (!domainAvailable) {
      console.log("DEBUG: Domain is not available");
      setPaymentError("Please choose an available domain.");
      return;
    }

    if (!email.trim()) {
      console.log("DEBUG: Email missing");
      setPaymentError("Please enter your email address.");
      return;
    }

    if (!cardNumber.trim()) {
      console.log("DEBUG: Card number missing");
      setPaymentError("Please enter the card number.");
      return;
    }

    if (!expiryMonth.trim() || !expiryYear.trim()) {
      console.log("DEBUG: Card expiry missing");
      setPaymentError("Please enter the card expiry date.");
      return;
    }

    if (!cvv.trim()) {
      console.log("DEBUG: CVV missing");
      setPaymentError("Please enter the card CVV.");
      return;
    }

    console.log("DEBUG: All frontend validation passed");

    setPaymentLoading(true);

    // =========================
    // SEND PAYMENT REQUEST
    // =========================

    try {
      const paymentUrl = `${API_BASE}/payment/create`;

      console.log("DEBUG: Sending payment request");
      console.log("Payment endpoint:", paymentUrl);

      const response = await fetch(paymentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          domain: domain.trim().toLowerCase(),
          email: email.trim(),

          card_number: cardNumber.trim(),
          expiry_month: expiryMonth.trim(),
          expiry_year: expiryYear.trim(),
          cvv: cvv.trim(),
        }),
      });

      console.log("DEBUG: Payment HTTP status:", response.status);
      console.log("DEBUG: Payment HTTP ok:", response.ok);

      const data = await response.json();

      console.log("DEBUG: Payment response received");
      console.log("Payment success:", data?.success);
      console.log("Payment status code:", data?.status_code);
      console.log("Payment reference:", data?.reference);

      // Do not print the complete Flutterwave response.
      console.log(
        "Flutterwave response exists:",
        !!data?.flutterwave
      );

      // =========================
      // PAYMENT FAILED
      // =========================

      if (!response.ok || !data.success) {
        console.log("DEBUG: Payment request failed");

        const flutterwaveMessage =
          data?.flutterwave?.error?.message ||
          data?.flutterwave?.message ||
          data?.message ||
          "Payment could not be started.";

        console.log(
          "DEBUG: Payment error message:",
          flutterwaveMessage
        );

        setPaymentError(flutterwaveMessage);
        setPaymentLoading(false);
        return;
      }

      // =========================
      // CHECK FOR AUTHORIZATION
      // =========================

      console.log("DEBUG: Payment request succeeded");
      console.log(
        "DEBUG: Looking for Flutterwave authorization URL"
      );

      const redirectUrl =
          data?.flutterwave?.data?.next_action?.redirect_url?.url ||
          data?.flutterwave?.data?.next_action?.redirect_url ||
          data?.flutterwave?.next_action?.redirect_url?.url ||
          data?.flutterwave?.next_action?.redirect_url ||
          data?.flutterwave?.data?.redirect_url ||
          data?.flutterwave?.redirect_url;

      if (redirectUrl) {
        console.log("DEBUG: Authorization URL received");
        console.log(
          "DEBUG: Redirecting to Flutterwave authorization"
        );

        window.location.href = redirectUrl;
        return;
      }

      // =========================
      // NO REDIRECT
      // =========================

      console.log("DEBUG: No authorization URL returned");

      setPaymentError(
        "Payment was created, but Flutterwave did not return an authorization page."
      );

      setPaymentLoading(false);
    } catch (error) {
      console.error("=================================");
      console.error("POWERCHOICE PAYMENT ERROR");
      console.error("=================================");
      console.error("Error type:", error?.name);
      console.error("Error message:", error?.message);
      console.error("Full error:", error);

      setPaymentError(
        "Unable to connect to the payment service. Please try again."
      );

      setPaymentLoading(false);
    }
  }

  // =========================
  // CHECKING REFERRAL
  // =========================

  if (checking) {
    return (
      <div className="join-page">
        <div className="join-loading">
          <div className="join-spinner"></div>

          <h3>Checking your referral</h3>

          <p>Please wait a moment...</p>
        </div>
      </div>
    );
  }

  // =========================
  // INVALID REFERRAL
  // =========================

  if (!code || !valid) {
    return (
      <div className="join-page">
        <div className="join-invalid-card">
          <div className="join-warning-icon">!</div>

          <h1>Referral Required</h1>

          <p>
            Please use a valid PowerChoice referral link to
            continue with your website setup.
          </p>

          <div className="join-invalid-note">
            If you believe you received this message by mistake,
            please contact the person who referred you.
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // JOIN PAGE
  // =========================

  return (
    <div className="join-page">
      <div className="join-wrapper">

        {/* Header */}
        <div className="join-header">
          <h1>
            Let's get your
            <span> business online.</span>
          </h1>

          <p>
            Tell us a few details and we'll help you get your
            PowerChoice website started.
          </p>
        </div>

        {/* Main Card */}
        <div className="join-card">

          {/* Referral */}
          <div className="join-referral">
            <div>
              <span className="join-referral-label">
                Referral Code
              </span>

              <strong>{code}</strong>
            </div>

            <span className="join-referral-check">✓</span>
          </div>

          <div className="join-divider"></div>

          {/* Form */}
          <form
            className="join-form"
            onSubmit={handlePayment}
          >

            {/* Company Name */}
            <div className="join-field">
              <label htmlFor="companyName">
                Company Name
              </label>

              <p className="join-field-description">
                What is the name of your company?
              </p>

              <div className="join-input-wrapper">
                <input
                  id="companyName"
                  type="text"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(event.target.value)
                  }
                />
              </div>
            </div>

            {/* Domain */}
            <div className="join-field">
              <label htmlFor="domain">
                Domain
              </label>

              <p className="join-field-description">
                What domain would you like to use for your website?
              </p>

              <div className="join-input-wrapper">
                <input
                  id="domain"
                  type="text"
                  placeholder="yourbusiness.com"
                  value={domain}
                  onChange={(event) =>
                    setDomain(event.target.value)
                  }
                />
              </div>

              {domain.trim() && (
                <div className="domain-status">
                  {domainChecking
                    ? "Checking domain..."
                    : domainMessage}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="join-field">
              <label htmlFor="email">
                Email address
              </label>

              <p className="join-field-description">
                We'll use this email to contact you about your website.
              </p>

              <div className="join-input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>
            </div>

            {/* Website Setup Fee */}
            <div className="join-field">
              <label>
                Website setup fee
              </label>

              <p className="join-field-description">
                The one-time payment for setting up your PowerChoice
                website is:
              </p>

              <strong className="join-price">
                ₦80,000
              </strong>
            </div>

            {/* Card Details */}
            <div className="join-field">
              <label htmlFor="cardNumber">
                Card Number
              </label>

              <p className="join-field-description">
                Enter your Flutterwave Sandbox test card details.
              </p>

              <div className="join-input-wrapper">
                <input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="Card number"
                  value={cardNumber}
                  onChange={(event) =>
                    setCardNumber(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                />
              </div>
            </div>

            {/* Expiry + CVV */}
            <div
              className="join-card-details-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
              }}
            >

              {/* Month */}
              <div className="join-field">
                <label htmlFor="expiryMonth">
                  Month
                </label>

                <div className="join-input-wrapper">
                  <input
                    id="expiryMonth"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="MM"
                    maxLength={2}
                    value={expiryMonth}
                    onChange={(event) =>
                      setExpiryMonth(
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                  />
                </div>
              </div>

              {/* Year */}
              <div className="join-field">
                <label htmlFor="expiryYear">
                  Year
                </label>

                <div className="join-input-wrapper">
                  <input
                    id="expiryYear"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="YYYY"
                    maxLength={4}
                    value={expiryYear}
                    onChange={(event) =>
                      setExpiryYear(
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                  />
                </div>
              </div>

              {/* CVV */}
              <div className="join-field">
                <label htmlFor="cvv">
                  CVV
                </label>

                <div className="join-input-wrapper">
                  <input
                    id="cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="CVV"
                    maxLength={4}
                    value={cvv}
                    onChange={(event) =>
                      setCvv(
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                  />
                </div>
              </div>

            </div>

            {/* Payment Error */}
            {paymentError && (
              <div
                className="join-payment-error"
                style={{
                  marginTop: "15px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
              >
                {paymentError}
              </div>
            )}

            {/* Continue */}
            <button
              type="submit"
              className="join-button"
              disabled={
                paymentLoading ||
                !companyName.trim() ||
                !domainAvailable ||
                !email.trim() ||
                !cardNumber.trim() ||
                !expiryMonth.trim() ||
                !expiryYear.trim() ||
                !cvv.trim()
              }
            >
              {paymentLoading
                ? "Starting payment..."
                : "Continue"}

              {!paymentLoading && <span>→</span>}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="join-footer">
          Your information is secure and will only be used
          to set up your PowerChoice website.
        </div>

      </div>
    </div>
  );
}

export default Join;

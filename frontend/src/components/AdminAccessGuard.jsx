import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getAccountToken,
  getCurrentUserAccount,
  logoutUserAccount,
} from "../api/api";

export default function AdminAccessGuard({
  permission,
  ownerOnly = false,
  children,
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      if (!getAccountToken()) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        const result = await getCurrentUserAccount();
        const user = result?.user ?? result?.account ?? result?.data?.user ?? result?.data ?? result;
        const isOwner = String(user?.role || "").toLowerCase() === "owner";
        const hasPermission = Boolean(user?.permissions?.[permission]);

        if (!active) return;

        if (!user || user.status !== "approved") {
          setStatus("denied");
          return;
        }

        if (ownerOnly && !isOwner) {
          setStatus("denied");
          return;
        }

        if (!isOwner && !ownerOnly && !hasPermission) {
          setStatus("denied");
          return;
        }

        setStatus("allowed");
      } catch (error) {
        if (!active) return;

        if (error.status === 401) {
          logoutUserAccount();
          setStatus("unauthenticated");
        } else if (error.status === 403) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      }
    }

    verifyAccess();

    return () => {
      active = false;
    };
  }, [permission, ownerOnly]);

  if (status === "checking") {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p>Verifying your Creator Yard access...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/account" replace />;
  }

  if (status === "denied") {
    return (
      <main style={{ maxWidth: 560, margin: "80px auto", padding: 24 }}>
        <h1>Access restricted</h1>
        <p>Your account does not have permission to access this workspace.</p>
        <button type="button" onClick={() => navigate("/admin/dashboard")}>
          Return to dashboard
        </button>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main style={{ maxWidth: 560, margin: "80px auto", padding: 24 }}>
        <h1>Unable to verify access</h1>
        <p>Please check your connection and try again.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  return children;
}

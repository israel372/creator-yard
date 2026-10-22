
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Dashboard from "./pages/profile/dashboard";
import Join from "./pages/join";
import PaymentCallback from "./pages/paymentCallback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Existing dashboard route */}
        <Route path="/profile/:profileToken" element={<Dashboard />} />

        {/* New admin dashboard URL */}
        <Route path="/admin/dashboard" element={<Dashboard />} />

        <Route path="/join" element={<Join />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        {/* Fallback for unknown URLs */}
        <Route
          path="*"
          element={
            <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
              <h1>Page not found</h1>
              <p>This Creator-Yard page does not exist.</p>
              <a href="/">Return to homepage</a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import VideoProduction from "./pages/videoProduction";
import RetailManagement from "./pages/retailManagement";
import Training from "./pages/training";
import Dashboard from "./pages/profile/dashboard";
import Join from "./pages/join";
import PaymentCallback from "./pages/paymentCallback";

import VideoPortfolioAdmin from "./pages/videoPortfolioAdmin";
import VideoProductionContentAdmin from "./pages/videoProductionContentAdmin";
import HomepageContentAdmin from "./pages/homepageContentAdmin";
import RetailManagementContentAdmin from "./pages/retailManagementContentAdmin";

import Account from "./pages/Account";
import OwnerSetup from "./pages/OwnerSetup";
import Accounts from "./pages/Accounts";
import AdminAccessGuard from "./components/AdminAccessGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-production" element={<VideoProduction />} />
        <Route path="/training" element={<Training />} />
        <Route path="/retail-management" element={<RetailManagement />} />

        <Route path="/profile/:profileToken" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/join" element={<Join />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        <Route path="/admin/video-portfolio" element={<AdminAccessGuard permission="manage_video_portfolio"><VideoPortfolioAdmin /></AdminAccessGuard>} />
        <Route path="/admin/video-production-content" element={<AdminAccessGuard permission="manage_video_content"><VideoProductionContentAdmin /></AdminAccessGuard>} />
        <Route path="/admin/homepage-content" element={<AdminAccessGuard permission="manage_homepage_content"><HomepageContentAdmin /></AdminAccessGuard>} />
        <Route path="/admin/retail-management-content" element={<AdminAccessGuard permission="manage_retail_content"><RetailManagementContentAdmin /></AdminAccessGuard>} />

        <Route path="/account" element={<Account />} />
        <Route path="/admin/setup-owner" element={<OwnerSetup />} />
        <Route path="/admin/accounts" element={<AdminAccessGuard ownerOnly><Accounts /></AdminAccessGuard>} />

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

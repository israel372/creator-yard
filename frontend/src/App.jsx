import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import VideoProduction from "./pages/videoProduction";
import Dashboard from "./pages/profile/dashboard";
import Join from "./pages/join";
import PaymentCallback from "./pages/paymentCallback";
import VideoPortfolioAdmin from "./pages/videoPortfolioAdmin";
import VideoProductionContentAdmin from "./pages/videoProductionContentAdmin";
import Account from "./pages/Account";
import OwnerSetup from "./pages/OwnerSetup";


import Accounts from "./pages/Accounts";
import HomepageContentAdmin from "./pages/homepageContentAdmin";
import RetailManagement from "./pages/retailManagement";
import RetailManagementContentAdmin from "./pages/retailManagementContentAdmin";
import Training from "./pages/training";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-production" element={<VideoProduction />} />

        <Route path="/profile/:profileToken" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/join" element={<Join />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/admin/video-portfolio" element={<VideoPortfolioAdmin />} />
        <Route path="/admin/video-production-content" element={<VideoProductionContentAdmin />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin/setup-owner" element={<OwnerSetup />} />


        <Route path="/admin/accounts" element={<Accounts />} />
        <Route path="/training" element={<Training />} />
        <Route path="/retail-management" element={<RetailManagement />} />
        <Route path="/admin/homepage-content" element={<HomepageContentAdmin />} />
        <Route path="/admin/retail-management-content" element={<RetailManagementContentAdmin />} />
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


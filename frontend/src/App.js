import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/inventory/Dashboard";
import SalesDashboard from "./pages/sales/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAccessRequired from "./pages/admin/AdminAccessRequired";
import CustomerDashboard from "./pages/customer/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AuthContext } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/GlobalTheme.css"; // Import the global theme CSS

function App() {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useContext(AuthContext);
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const hasStoredToken = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    [
      "customer-orders",
      "customer-cart",
      "inventory-products",
      "inventoryProducts",
      "purchase-orders",
      "sales-stats",
      "recent-sales",
      "tracked-customers",
      "newSale",
      "inventoryUpdate",
      "newProductAdded",
      "reorder-notifications",
    ].forEach((key) => localStorage.removeItem(key));
  }, []);

  if (loading && hasStoredToken && !isAuthenticated) {
    // Show loading state
    return <div>Loading...</div>;
  }

  // Helper function to handle redirects based on user role
  const getRedirectBasedOnRole = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;

    if (!user || !user.role) return <Navigate to="/login" />;

    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" />;
      case "sales":
        return <Navigate to="/sales" />;
      case "inventory_manager":
        return <Navigate to="/inventory" />;
      case "customer":
        return <Navigate to="/customer" />;
      default:
        return <Navigate to="/login" />;
    }
  };

  // Protected route component
  const ProtectedRoute = ({ element, requiredRole }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    // If role is specified, check if user has that role
    if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
      // For admin users, allow access to all protected routes
      return getRedirectBasedOnRole();
    }

    return element;
  };

  return (
    <ThemeProvider>
      <Box sx={{ display: "flex", height: "100vh" }}>
        {!isAuthPage && <Sidebar />}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            p: isAuthPage ? 0 : 3,
            width: isAuthPage ? "100%" : "calc(100% - 240px)",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          {!isAuthPage && <Navbar />}

          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={isAuthenticated ? getRedirectBasedOnRole() : <Login />}
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? getRedirectBasedOnRole() : <Register />
              }
            />

            {/* Admin Authentication Routes */}
            <Route
              path="/admin/login"
              element={
                isAuthenticated && user?.role === "admin" ? (
                  <Navigate to="/admin" />
                ) : (
                  <AdminLogin />
                )
              }
            />
            <Route
              path="/adminlogin"
              element={<Navigate to="/admin/login" replace />}
            />
            <Route
              path="/admin/access-required"
              element={<AdminAccessRequired />}
            />

            {/* Root route - redirect to appropriate dashboard */}
            <Route path="/" element={getRedirectBasedOnRole()} />

            {/* Protected Routes */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute
                  element={<Dashboard />}
                  requiredRole="inventory_manager"
                />
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute
                  element={<SalesDashboard />}
                  requiredRole="sales"
                />
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  element={<AdminDashboard />}
                  requiredRole="admin"
                />
              }
            />

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                isAuthenticated ? (
                  <CustomerDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/customer/orders"
              element={
                isAuthenticated ? (
                  <CustomerDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                isAuthenticated ? <Settings /> : <Navigate to="/login" />
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;


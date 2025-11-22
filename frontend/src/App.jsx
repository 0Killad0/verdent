import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LoadingScreen from './components/Common/LoadingScreen';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';
import OrderHistory from './pages/user/OrderHistory';
import OrderDetails from './pages/user/OrderDetails';
import AddressBook from './pages/user/AddressBook';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Checkout Pages
import Checkout from './pages/Checkout';
import Shipping from './pages/checkout/Shipping';
import Payment from './pages/checkout/Payment';
import PlaceOrder from './pages/checkout/PlaceOrder';
import OrderSuccess from './pages/checkout/OrderSuccess';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminProductEdit from './pages/admin/ProductEdit';
import AdminOrderDetails from './pages/admin/OrderDetails';

//Footer Pages
import Contact from './components/Footer/Contact';
import ShippingInfo from './components/Footer/Shippinginfo';
import FAQ from './components/Footer/FAQ';
import Returns from './components/Footer/Returns';


/* ============================================================
   Loading Screen Component
 

/* ============================================================
   Main App Component
   ============================================================ */
function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (auth check, data preload, etc.)
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router 
    future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      <AuthProvider>
        <CartProvider>
          <AnimatePresence>
            {isAppLoading ? (
              <LoadingScreen key="loading" />
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="min-h-screen bg-forest-50 flex flex-col"
              >
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/shippinginfo" element={<ShippingInfo />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/returns" element={<Returns />} />

                    {/* User Dashboard Routes */}
                    <Route path="/user/dashboard" element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/user/profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/user/orders" element={
                      <ProtectedRoute>
                        <OrderHistory />
                      </ProtectedRoute>
                    } />
                    <Route path="/user/order/:id" element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/user/addresses" element={
                      <ProtectedRoute>
                        <AddressBook />
                      </ProtectedRoute>
                    } />

                    {/* Checkout Routes */}
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout/shipping" element={
                      <ProtectedRoute>
                        <Shipping />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout/payment" element={
                      <ProtectedRoute>
                        <Payment />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout/place-order" element={
                      <ProtectedRoute>
                        <PlaceOrder />
                      </ProtectedRoute>
                    } />
                    <Route path="/order/success/:id" element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute adminOnly>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products" element={
                      <ProtectedRoute adminOnly>
                        <AdminProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products/new" element={
                      <ProtectedRoute adminOnly>
                        <AdminProductEdit />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products/edit/:id" element={
                      <ProtectedRoute adminOnly>
                        <AdminProductEdit />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <ProtectedRoute adminOnly>
                        <AdminOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/order/:id" element={
                      <ProtectedRoute adminOnly>
                        <AdminOrderDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute adminOnly>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />

                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      theme: { primary: 'green', secondary: 'black' },
                    },
                    error: {
                      duration: 5000,
                      style: { background: '#ef4444', color: '#fff' },
                    },
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

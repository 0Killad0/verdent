// src/pages/checkout/Payment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://verdent-production.up.railway.app";

/* ======================================================
   UPI Deep Link Payment
====================================================== */
const UpiPaymentOption = ({ totalAmount }) => {
  const [loading, setLoading] = useState(false);

  const initiateUpiPayment = () => {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS) {
      toast.error("UPI deep links do not work reliably on iOS.");
      return;
    }

    setLoading(true);

    const VPA = "verdentstore@okaxis";
    const orderId = "ORDER_UPI_" + Date.now();
    const amount = Number(totalAmount).toFixed(2);

    const upiUri =
      `upi://pay?pa=${VPA}&pn=VerdentStore&am=${amount}&cu=INR&tn=Order_${orderId}`;

    try {
      window.location.href = upiUri;
      toast.success("Opening UPI app...");
    } catch (e) {
      toast.error("Failed to open UPI app");
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-inner bg-green-50">
      <h4 className="font-semibold text-green-700 mb-2">Pay via UPI</h4>
      <button
        onClick={initiateUpiPayment}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
      >
        {loading ? "Opening UPI…" : `Pay ₹${Number(totalAmount).toFixed(2)} via UPI`}
      </button>
    </div>
  );
};

/* ======================================================
   Razorpay Payment Component
====================================================== */
const PaymentOptions = ({ totalAmount, orderDetails }) => {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const { user, waitForAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {};
      script.onerror = () => toast.error("Failed to load Razorpay script.");
      document.body.appendChild(script);
    }
  }, []);

  const getStoredToken = () =>
    localStorage.getItem("marketsphereToken") ||
    sessionStorage.getItem("marketsphereToken");

  const handleRazorpayPayment = useCallback(async () => {
    if (totalAmount <= 0) {
      toast.error("Invalid order amount");
      return;
    }

    try {
      setLoading(true);

      if (waitForAuthReady) await waitForAuthReady();

      const token = getStoredToken();
      if (!token) {
        toast.error("Please log in.");
        navigate("/login", { state: { from: "/checkout/payment" } });
        return;
      }

      console.log("🔵 Creating order…");

      const createResp = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        { amount: totalAmount },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Create order response:", createResp.data);

      if (!createResp?.data?.order) {
        toast.error("Failed to create Razorpay order.");
        return;
      }

      const { order, key } = createResp.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Verdent Store",
        description: "Order Payment",
        order_id: order.id,

        handler: async (response) => {
          console.log("Payment success:", response);

          try {
            const verifyResp = await axios.post(
              `${API_BASE}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                withCredentials: true,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log("Verify response:", verifyResp.data);

            if (verifyResp?.data?.success) {
              toast.success("Payment Verified!");
              navigate("/checkout/place-order", {
                state: {
                  ...orderDetails,
                  paymentMethod: "Razorpay",
                  paymentStatus: "paid",
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                },
              });
            } else {
              toast.error("Verification failed.");
            }
          } catch (e) {
            console.error("Verify error:", e);
            toast.error("Verification failed.");
          }
        },

        prefill: {
          name:
            `${orderDetails.selectedAddress?.firstName || ""} ${orderDetails.selectedAddress?.lastName || ""}`.trim(),
          email: orderDetails.selectedAddress?.email || user?.email || "",
        },

        theme: { color: "#10B981" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        toast.error(response?.error?.description || "Payment failed.");
      });

      rzp.open();
    } catch (err) {
      console.error("❌ Razorpay flow error:", err);
      console.error("Server response:", err?.response?.data);
      toast.error(err?.response?.data?.message || "Payment could not be started.");
    } finally {
      setLoading(false);
    }
  }, [totalAmount, orderDetails, navigate, waitForAuthReady, user]);

  const handleCOD = () => {
    navigate("/checkout/place-order", {
      state: {
        ...orderDetails,
        paymentMethod: "Cash On Delivery (COD)",
        paymentStatus: "pending",
      },
    });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">
        Select Payment Method
      </h4>

      <div className="flex space-x-4 border-b pb-3">
        <button
          onClick={() => setSelectedMethod("card")}
          className={`px-4 py-2 font-medium ${
            selectedMethod === "card"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-green-600"
          }`}
        >
          Razorpay (Card / UPI / Netbanking)
        </button>

        <button
          onClick={() => setSelectedMethod("upi")}
          className={`px-4 py-2 font-medium ${
            selectedMethod === "upi"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-green-600"
          }`}
        >
          UPI Deep Link 🇮🇳
        </button>

        <button
          onClick={() => setSelectedMethod("cod")}
          className={`px-4 py-2 font-medium ${
            selectedMethod === "cod"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-green-600"
          }`}
        >
          Cash On Delivery
        </button>
      </div>

      <div className="py-4">
        {selectedMethod === "card" && (
          <div className="p-4 border rounded-lg shadow-inner bg-white">
            <button
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg"
            >
              {loading ? "Processing…" : "Pay with Razorpay"}
            </button>
          </div>
        )}

        {selectedMethod === "upi" && (
          <UpiPaymentOption totalAmount={totalAmount} />
        )}

        {selectedMethod === "cod" && (
          <div className="p-4 border rounded-lg bg-yellow-50 space-y-4">
            <p className="text-yellow-800">
              Pay ₹{totalAmount.toFixed(2)} when your order is delivered.
            </p>
            <button
              onClick={handleCOD}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg"
            >
              Confirm Cash On Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ======================================================
   FULL PAYMENT PAGE
====================================================== */
export default function Payment() {
  const { getCartTotal, getCartItemsCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedAddress, shippingMethod } = location.state || {};

  const subtotal = getCartTotal();
  const defaultShippingCost = subtotal > 5000 ? 0 : 250;
  const shippingCost =
    shippingMethod === "express" ? 500 : defaultShippingCost;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please log in to continue");
      navigate("/login", { state: { from: "/checkout/payment" } });
    }
  }, [isAuthenticated, navigate]);

  if (!selectedAddress) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold">Shipping Information Missing</h2>
        <button
          onClick={() => navigate("/checkout")}
          className="btn-primary mt-3"
        >
          Back to Checkout
        </button>
      </div>
    );
  }

  const orderDetails = {
    selectedAddress,
    shippingMethod: shippingMethod || "standard",
    shippingCost,
    tax,
    subtotal,
    totalPrice: total,
    state: location.state,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Left */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
            <PaymentOptions totalAmount={total} orderDetails={orderDetails} />
          </div>

          <button
            onClick={() =>
              navigate("/checkout/shipping", {
                state: { selectedAddress, shippingMethod },
              })
            }
            className="mt-4 btn-outline"
          >
            Back to Shipping
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Items ({getCartItemsCount()})</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>
                {shippingCost === 0 ? "FREE" : `₹${shippingCost.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const OrderSuccess = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Use environment variable for base URL (fallback to localhost)
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/orders/${id}`);
        setOrder(data);
        toast.success("Your order has been confirmed successfully!");
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Could not load your order details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, API_BASE_URL]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // No order found
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">
          Order Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          We couldn't find the order you're looking for.
        </p>
        <Link to="/user/orders" className="btn-primary">
          View Your Orders
        </Link>
      </div>
    );
  }

  // Success UI
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-forest-800 mb-4">
          Order Confirmed!
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Thank you for your order, {user?.name || order.user.name}!
        </p>
        <p className="text-gray-600">
          Your order has been received and is being processed.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div>
            <h3 className="text-lg font-semibold text-forest-800 mb-4">
              Order Details
            </h3>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Order Number:</strong>{" "}
                #{order._id.slice(-8).toUpperCase()}
              </p>
              <p>
                <strong>Order Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹
                {order.totalPrice.toFixed(2)}
                {/* 💡 FIXED: Was '$', changed to '₹' for consistency */}
              </p>
              <p>
                <strong>Status:</strong>
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium capitalize">
                  {order.status || "Processing"}
                </span>
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold text-forest-800 mb-4">
              Shipping Address
            </h3>
            <div className="text-gray-600">
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h3 className="text-lg font-semibold text-forest-800 mb-4">
          Order Items
        </h3>
        <div className="space-y-4">
          {order.orderItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                // Add a fallback image in case the src is broken
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/64x64/eee/ccc?text=Item";
                }}
              />
              <div className="flex-1">
                <Link
                  to={`/product/${item.productId}`}
                  className="text-lg font-semibold text-forest-800 hover:text-forest-600 transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-gray-600">Qty: {item.qty}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-wood-600">
                  ₹{(item.price * item.qty).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-forest-50 border border-forest-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-forest-800 mb-4">
          What's Next?
        </h3>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-center">
            <span className="w-6 h-6 bg-forest-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              1
            </span>
            <span>You'll receive an order confirmation email shortly.</span>
          </div>
          <div className="flex items-center">
            <span className="w-6 h-6 bg-forest-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              2
            </span>
            <span>We'll notify you when your order ships.</span>
          </div>
          <div className="flex items-center">
            <span className="w-6 h-6 bg-forest-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              3
            </span>
            <span>Track your order from your account dashboard.</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/user/orders" className="btn-primary text-center">
          View Order Details
        </Link>
        <Link to="/products" className="btn-outline text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;

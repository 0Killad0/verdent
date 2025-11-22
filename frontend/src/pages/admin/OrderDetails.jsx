import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getAccessToken, waitForAuthReady, isAuthenticated, user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- Fetch Order (Fixed) ---
  const fetchOrder = async () => {
    setLoading(true);

    try {
      await waitForAuthReady(); // wait for AuthProvider to finish initializing

      const token = getAccessToken();
      if (!token) {
        console.warn("AdminOrderDetails: No token available yet.");
        return navigate('/login');
      }

      const { data } = await axios.get(`/api/orders/admin/${id}`);

      setOrder(data);
      setTrackingNumber(data.trackingNumber || '');
    } catch (error) {
      console.error('Error fetching order:', error);

      const msg = error.response?.data?.message || 'Failed to load order';
      toast.error(msg);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever ID changes
  useEffect(() => {
    fetchOrder();
  }, [id]); 

  // --- Update Order Status (Fixed) ---
  const updateOrderStatus = async (status) => {
    try {
      if (actionLoading) return;
      setActionLoading(true);

      const token = getAccessToken();
      if (!token) return navigate('/login');

      let endpoint = '';
      let body = {};

      switch (status) {
        case 'shipped':
          endpoint = 'ship';
          body = { trackingNumber: trackingNumber || `TRK${Date.now()}` };
          break;

        case 'delivered':
          endpoint = 'deliver';
          break;

        case 'cancelled':
          endpoint = 'cancel';
          break;

        default:
          return;
      }

      await axios.put(`/api/orders/${order._id}/${endpoint}`, body);
      toast.success(`Order marked as ${status}`);

      await fetchOrder();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' })
      .format(price);

  // --- UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="text-center text-gray-500 text-xl">Loading order…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-600">Order Not Found</h2>
        <Link
          to="/admin/orders"
          className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-2">
              Order # {order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link to="/admin/orders" className="text-green-600 hover:text-green-800">
            ← Back to Orders
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>

              <div className="space-y-4">
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex items-center space-x-4 border-b pb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                      <p className="text-gray-600 text-sm">
                        {formatPrice(item.price)} × {item.quantity} =
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatPrice(order.itemsPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-medium">{formatPrice(order.shippingPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-medium">{formatPrice(order.taxPrice)}</span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

              <div className="space-y-2">
                <p><span className="text-gray-600">Name:</span> {order.user?.name}</p>
                <p><span className="text-gray-600">Email:</span> {order.user?.email}</p>
                <p><span className="text-gray-600">User ID:</span> {order.user?._id}</p>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

              {order.shippingAddress ? (
                <div className="space-y-3">
                  <p><span className="text-gray-600">Name:</span> {order.shippingAddress.name}</p>
                  <p><span className="text-gray-600">Address:</span> {order.shippingAddress.street}</p>
                  <p><span className="text-gray-600">City:</span> {order.shippingAddress.city}</p>
                  <p><span className="text-gray-600">State:</span> {order.shippingAddress.state}</p>
                  <p><span className="text-gray-600">Postal:</span> {order.shippingAddress.postalCode}</p>
                  <p><span className="text-gray-600">Phone:</span> {order.shippingAddress.phone}</p>

                  {order.trackingNumber &&
                    <p><span className="text-gray-600">Tracking:</span> {order.trackingNumber}</p>
                  }

                  {order.shippedAt &&
                    <p><span className="text-gray-600">Shipped:</span> {formatDate(order.shippedAt)}</p>
                  }

                  {order.deliveredAt &&
                    <p><span className="text-gray-600">Delivered:</span> {formatDate(order.deliveredAt)}</p>
                  }
                </div>
              ) : (
                <p className="text-gray-500">No shipping info available.</p>
              )}
            </div>

            {/* Order Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Order Actions</h2>

              {order.status === 'processing' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full mb-4 px-3 py-2 border rounded"
                  />

                  <button
                    onClick={() => updateOrderStatus('shipped')}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded"
                  >
                    {actionLoading ? 'Processing…' : 'Mark as Shipped'}
                  </button>

                  <button
                    onClick={() => updateOrderStatus('cancelled')}
                    disabled={actionLoading}
                    className="w-full bg-red-600 text-white py-2 rounded mt-2"
                  >
                    {actionLoading ? 'Processing…' : 'Cancel Order'}
                  </button>
                </>
              )}

              {order.status === 'shipped' && (
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-2 rounded"
                >
                  {actionLoading ? 'Processing…' : 'Mark as Delivered'}
                </button>
              )}

              {(order.status === 'delivered' || order.status === 'cancelled') && (
                <p className="text-center text-gray-500">
                  No actions available for {order.status} orders.
                </p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;

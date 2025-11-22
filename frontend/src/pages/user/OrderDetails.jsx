import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth(); // Use AuthContext method
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      // Use the AuthContext method to get token
      const token = getAccessToken();
      
      if (!token) {
        toast.error('Please log in to view your orders');
        navigate('/login');
        return;
      }

      const { data } = await axios.get(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      const msg = error.response?.data?.message || 'Failed to load order details';
      toast.error(msg);

      if (error.response?.status === 403 || error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate, getAccessToken]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    if (cancelReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      const token = getAccessToken();
      
      const reasonText = cancelReason === 'other' ? otherReason : cancelReason;
      
      const { data } = await axios.put(
        `/api/orders/${id}/cancel`,
        { reason: reasonText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Order cancelled successfully');
      setOrder(data.order);
      setShowCancelModal(false);
      setCancelReason('');
      setOtherReason('');
      
      // Debug: Log the order data
      console.log('Cancelled order data:', data.order);
      console.log('Cancellation reason:', data.order.cancellationReason);
      console.log('Cancelled at:', data.order.cancelledAt);
    } catch (error) {
      console.error('Error cancelling order:', error);
      const msg = error.response?.data?.message || 'Failed to cancel order';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if order can be cancelled (not delivered and not already cancelled)
  const canCancelOrder = order && order.status !== 'delivered' && order.status !== 'cancelled';

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-600">Order Not Found</h2>
        <p className="text-gray-500 mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/user/orders" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Please tell us why you're cancelling this order. This helps us improve our service.
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Changed my mind"
                  checked={cancelReason === 'Changed my mind'}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">Changed my mind</span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Found a better price elsewhere"
                  checked={cancelReason === 'Found a better price elsewhere'}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">Found a better price elsewhere</span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Ordered by mistake"
                  checked={cancelReason === 'Ordered by mistake'}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">Ordered by mistake</span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="cancelReason"
                  value="Delivery taking too long"
                  checked={cancelReason === 'Delivery taking too long'}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">Delivery taking too long</span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="cancelReason"
                  value="other"
                  checked={cancelReason === 'other'}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">Other (please specify)</span>
              </label>

              {cancelReason === 'other' && (
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Please tell us your reason..."
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  rows="3"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setOtherReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                disabled={cancelling}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest-800">Order Details</h1>
          <p className="text-gray-600 mt-2">
            Order # {order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Cancelled Notice */}
      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-semibold">This order has been cancelled.</p>
          {order.cancellationReason && (
            <div className="mt-3 bg-white border-l-4 border-red-400 p-3 rounded">
              <p className="text-sm text-gray-600 font-semibold">Cancellation Reason:</p>
              <p className="text-gray-800 mt-1">{order.cancellationReason}</p>
            </div>
          )}
          {order.cancelledAt && (
            <p className="text-red-600 text-sm mt-2">
              Cancelled on: {formatDate(order.cancelledAt)}
            </p>
          )}
          <p className="text-red-600 text-sm mt-1">If you were charged, a refund will be processed shortly.</p>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.orderItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                }}
              />
              <div className="flex-1">
                <p className="text-lg font-semibold text-forest-800">{item.name}</p>
                <p className="text-gray-600">Qty: {item.qty}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-wood-600">
                  ₹{(item.price * item.qty).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Shipping Address</h2>
        <div className="text-gray-700">
          <p className="font-semibold">{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

      {/* Tracking Information (if shipped) */}
      {order.trackingNumber && order.status === 'shipped' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-semibold">Tracking Information</p>
          <p className="text-blue-600 mt-1">Tracking Number: <span className="font-mono font-bold">{order.trackingNumber}</span></p>
          <p className="text-blue-600 text-sm mt-1">Shipped on: {formatDate(order.shippedAt)}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-4">Order Summary</h2>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Items ({order.orderItems.reduce((sum, item) => sum + item.qty, 0)})</span>
          <span>₹{order.itemsPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Shipping</span>
          <span>₹{order.shippingPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600 mb-2">
          <span>Tax</span>
          <span>₹{order.taxPrice.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-semibold text-forest-800">
          <span>Total</span>
          <span>₹{order.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/user/orders"
          className="flex-1 bg-forest-600 hover:bg-forest-700 text-white py-3 px-4 rounded-lg font-semibold text-center transition-colors"
        >
          Back to Orders
        </Link>

        {canCancelOrder && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Help Text for Cancellation */}
      {canCancelOrder && (
        <p className="text-sm text-gray-500 text-center mt-3">
          You can cancel this order at any time before it's delivered.
        </p>
      )}
    </div>
  );
};

export default OrderDetails;
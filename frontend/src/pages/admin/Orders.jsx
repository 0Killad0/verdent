import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  // Prevent multiple clicks on actions
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, sortConfig]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('marketsphereToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: currentPage,
        limit: '10',
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const { data } = await axios.get(`/api/orders?${params}`, { headers });
      setOrders(data.orders);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, trackingNumber = '') => {
    try {
      // prevent repeated clicks for the same order
      if (actionLoading === orderId) return;
      setActionLoading(orderId);

      const token = localStorage.getItem('marketsphereToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let endpoint = '';
      let data = {};

      switch (status) {
        case 'shipped':
          endpoint = `ship`;
          data = { trackingNumber: trackingNumber || `TRK${Date.now()}` };
          break;
        case 'delivered':
          endpoint = `deliver`;
          break;
        case 'cancelled':
          endpoint = `cancel`;
          break;
        default:
          setActionLoading(null);
          return;
      }

      await axios.put(`/api/orders/${orderId}/${endpoint}`, data, { headers });
      toast.success(`Order marked as ${status}`);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="h-12 bg-gray-300 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-800">Order Management</h1>
        <p className="text-gray-600 mt-2">Manage and track customer orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
            >
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="ml-auto">
            <div className="text-sm text-gray-600">
              Sorted by: <span className="font-medium">{sortConfig.key}</span> 
              ({sortConfig.direction === 'desc' ? 'Descending' : 'Ascending'})
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('_id')}
                >
                  Order ID{getSortIndicator('_id')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  Date{getSortIndicator('createdAt')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('totalPrice')}
                >
                  Total{getSortIndicator('totalPrice')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status{getSortIndicator('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-forest-800">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.user?.name}</div>
                    <div className="text-sm text-gray-500">{order.user?.email}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-wood-600">
                      ₹{order.totalPrice.toFixed(2)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">

                      <Link
                        to={`/admin/order/${order._id}`}
                        className="text-forest-600 hover:text-forest-700 transition-colors"
                      >
                        View Details
                      </Link>

                      {/* PROCESSING ACTIONS */}
                      {order.status === 'processing' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateOrderStatus(order._id, 'shipped')}
                            disabled={actionLoading === order._id}
                            className={`text-blue-600 hover:text-blue-700 transition-colors text-xs 
                              ${actionLoading === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === order._id ? 'Processing...' : 'Mark Shipped'}
                          </button>

                          <button
                            onClick={() => updateOrderStatus(order._id, 'cancelled')}
                            disabled={actionLoading === order._id}
                            className={`text-red-600 hover:text-red-700 transition-colors text-xs 
                              ${actionLoading === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === order._id ? 'Processing...' : 'Cancel'}
                          </button>
                        </div>
                      )}

                      {/* SHIPPED ACTION */}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'delivered')}
                          disabled={actionLoading === order._id}
                          className={`text-green-600 hover:text-green-700 transition-colors text-xs
                            ${actionLoading === order._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading === order._id ? 'Processing...' : 'Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!orders || orders.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? 'No orders have been placed yet.' 
                : `No orders with status "${statusFilter}" found.`}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                currentPage === index + 1
                  ? 'bg-forest-500 text-white border-forest-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    'all', 'Electronics', 'Cup', 'Home & Kitchen', 
    'Nature Books', 'Artisan Crafts', 'Sustainable Living', 'Wilderness Tools'
  ];

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/api/products?page=${currentPage}&limit=10`;
      if (categoryFilter !== 'all') {
        url += `&category=${categoryFilter}`;
      }
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const { data } = await axios.get(url);
      setProducts(data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleOffer = async (productId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.put(`/api/products/${productId}`, {
        offer: { active: newStatus }
      });
      toast.success(`Offer ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast.error('Failed to update offer status');
    }
  };

  const getStockStatus = (stock) => {
    if (stock > 10) return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
    if (stock > 0) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
  };

  const getOfferStatus = (product) => {
    if (!product.offer?.active) {
      return { text: 'No Offer', color: 'text-gray-600 bg-gray-100' };
    }
    
    const now = new Date();
    const validUntil = product.offer.validUntil ? new Date(product.offer.validUntil) : null;
    
    if (validUntil && now > validUntil) {
      return { text: 'Expired', color: 'text-red-600 bg-red-100' };
    }
    
    return { 
      text: `${product.offer.discountPercentage}% OFF`, 
      color: 'text-green-600 bg-green-100' 
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-300 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your store's products and offers</p>
          </div>
          <Link
            to="/admin/products/new"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center shadow-md hover:shadow-lg"
          >
            <span className="mr-2">+</span>
            Add New Product
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.products?.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const offerStatus = getOfferStatus(product);
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.images?.[0] ? `/api/images/${product.images[0]._id || product.images[0]}` : '/api/placeholder/100/100'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-green-600">
                            ₹{product.currentPrice || product.price}
                          </div>
                          {product.offer?.active && product.originalPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ₹{product.originalPrice}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.stock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${offerStatus.color}`}>
                          {offerStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="text-green-600 hover:text-green-700 transition-colors font-medium"
                            title="Edit Product"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/product/${product._id}`}
                            className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                            title="View Product"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleToggleOffer(product._id, product.offer?.active)}
                            className={`transition-colors font-medium ${
                              product.offer?.active 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={product.offer?.active ? 'Deactivate Offer' : 'Activate Offer'}
                          >
                            {product.offer?.active ? 'Deactivate Offer' : 'Activate Offer'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-700 transition-colors font-medium"
                            title="Delete Product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!products.products || products.products.length === 0) && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first product.'
                }
              </p>
              <Link 
                to="/admin/products/new" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
              >
                <span className="mr-2">+</span>
                Add Your First Product
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Show only limited pages with ellipsis
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <span key={pageNum} className="px-2 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {products.products && products.products.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{products.total || 0}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {products.products.filter(p => p.offer?.active).length}
              </div>
              <div className="text-sm text-gray-600">Active Offers</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">
                {products.products.filter(p => p.stock === 0).length}
              </div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">
                {products.products.filter(p => p.stock > 0 && p.stock <= 10).length}
              </div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
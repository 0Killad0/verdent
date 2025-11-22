import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Stats from '../models/Stats.js';
import { auth, admin } from '../middleware/auth.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

/* =========================
   STATS HELPER
   Ensures a single stats doc exists and returns it
========================= */
const getStats = async () => {
  let stats = await Stats.findOne();
  if (!stats) {
    stats = await Stats.create({});
  }
  return stats;
};

// Helper function to generate order items HTML for emails
const generateOrderItemsHTML = (orderItems) => {
  let itemsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif;">
      <thead>
        <tr>
          <th style="border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; background-color: #f8fafc; color: #4a5568; font-size: 14px; text-transform: uppercase;">Product</th>
          <th style="border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: center; background-color: #f8fafc; color: #4a5568; font-size: 14px; text-transform: uppercase;">Quantity</th>
          <th style="border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: right; background-color: #f8fafc; color: #4a5568; font-size: 14px; text-transform: uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const item of orderItems) {
    itemsHtml += `
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; vertical-align: middle; color: #333; font-size: 15px;">
          <img src="${item.image}" alt="${item.name}" width="60" style="vertical-align: middle; margin-right: 12px; border-radius: 8px; object-fit: cover; height: 60px; border: 1px solid #e2e8f0;">
          ${item.name}
        </td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: center; vertical-align: middle; color: #333; font-size: 15px;">${item.qty}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: right; vertical-align: middle; color: #333; font-size: 15px; font-weight: 600;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>
    `;
  }
  itemsHtml += `
      </tbody>
    </table>
  `;
  return itemsHtml;
};

// Helper function to generate shipping address HTML
const generateShippingAddressHTML = (shippingAddress) => {
  if (!shippingAddress) return '<p>No shipping address provided</p>';
  return `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; font-family: Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6;">
      <strong>${shippingAddress.name || ''}</strong><br>
      ${shippingAddress.street || shippingAddress.address || ''}<br>
      ${shippingAddress.city || ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''} ${shippingAddress.postalCode || shippingAddress.zipCode || ''}<br>
      ${shippingAddress.country || ''}
    </div>
  `;
};

// Helper function to create a styled email wrapper
const wrapEmail = (title, content) => {
  return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #2d3748; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">MarketSphere</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #2d3748; text-align: center; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">${title}</h2>
        <div style="color: #4a5568; font-size: 16px;">
          ${content}
        </div>
        <p style="margin-top: 32px; color: #555; font-size: 16px;">Best regards,<br/>The MarketSphere Team</p>
      </div>
      <div style="background-color: #f8fafc; color: #718096; padding: 24px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} MarketSphere. All rights reserved.</p>
        <p style="margin: 4px 0 0;">123 Market St, Commerce City, 12345</p>
      </div>
    </div>
  `;
};

/* =======================
   CREATE NEW ORDER
   (also update stats: totalRevenue += totalPrice, totalOrders += 1)
======================= */
router.post('/', auth, async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Verify product existence and stock
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          message: `Product "${item.name}" is no longer available.`,
        });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Not enough stock for "${item.name}". Only ${product.stock} available.`,
        });
      }
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paidAt: Date.now(),
      status: 'processing',
      paymentResult: {
        id: `mock_${Date.now()}`,
        status: 'completed',
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      },
    });

    const createdOrder = await order.save();

    // Reduce stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }

    // Update stats: increase revenue and orders count
    try {
      const stats = await getStats();
      stats.totalRevenue += Number(totalPrice || 0);
      stats.totalOrders += 1;
      await stats.save();
    } catch (statsErr) {
      console.error('Failed to update stats on order creation:', statsErr);
      // don't fail the order if stats update fails
    }

    // Populate user info for email
    const orderForEmail = await Order.findById(createdOrder._id).populate('user', 'name email');

    // Send confirmation email
    try {
      const itemsHtml = generateOrderItemsHTML(orderForEmail.orderItems);
      const shippingHtml = generateShippingAddressHTML(orderForEmail.shippingAddress);
      
      const emailContent = `
        <p>Hi ${orderForEmail.user.name},</p><br>
        <p>Thank you for your purchase.</p><br>
        <p> We've received your order, and it's now being processed.</p>
        <p style="text-align: center; font-size: 18px; font-weight: 600; color: #333; margin: 24px 0;">
          <strong>Order ID:</strong> #${orderForEmail._id.toString().slice(-8).toUpperCase()}
        </p>
        
        <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">Order Summary</h3>
        ${itemsHtml}
        
        <table style="width: 100%; margin-top: 20px; font-family: Arial, sans-serif;">
          <tr>
            <td style="padding-right: 10px; vertical-align: top;">
              <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 20px; font-size: 18px;">Shipping Address</h3>
              ${shippingHtml}
            </td>
            <td style="width: 40%; padding-left: 10px; vertical-align: top;">
              <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 20px; font-size: 18px;">Total</h3>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; font-size: 15px;">
                <p style="margin: 0 0 10px; display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>₹${orderForEmail.itemsPrice.toFixed(2)}</span>
                </p>
                <p style="margin: 0 0 10px; display: flex; justify-content: space-between;">
                  <span>Shipping:</span>
                  <span>₹${orderForEmail.shippingPrice.toFixed(2)}</span>
                </p>
                <p style="margin: 0 0 12px; display: flex; justify-content: space-between;">
                  <span>Tax:</span>
                  <span>₹${orderForEmail.taxPrice.toFixed(2)}</span>
                </p>
                <p style="margin: 12px 0 0; padding-top: 12px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 1.3em; font-weight: bold; color: #2d3748;">
                  <span>Total:</span>
                  <span>₹${orderForEmail.totalPrice.toFixed(2)}</span>
                </p>
              </div>
            </td>
          </tr>
        </table>
        
        <p style="margin-top: 30px;">We'll send you another email once your order has shipped.</p>
      `;
      
      const emailHtml = wrapEmail('🎉 Your Order is Confirmed!', emailContent);
      
      const textFallback = `
        Your order #${orderForEmail._id.toString().slice(-8).toUpperCase()} is confirmed.
        Total: ₹${orderForEmail.totalPrice.toFixed(2)}
        Items:
        ${orderForEmail.orderItems.map(item => `- ${item.name} (Qty: ${item.qty}, Price: ₹${item.price.toFixed(2)})`).join('\n')}
      `;

      await sendEmail(
        orderForEmail.user.email,
        `Order Confirmed - #${orderForEmail._id.toString().slice(-8).toUpperCase()}`,
        emailHtml,
        textFallback
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request, just log the email error
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order Creation Error:', error);
    res.status(400).json({ message: 'Error creating order' });
  }
});

/* =======================
   GET USER ORDERS (PAGINATED) - exclude cancelled
======================= */
router.get('/my-orders', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get sort parameters from query
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    // Exclude cancelled orders for user list
    const query = {
      user: req.user._id,
      status: { $ne: 'cancelled' }
    };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   GET SINGLE ORDER BY ID
======================= */
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ADMIN: GET ALL ORDERS (PAGINATED & SORTED)
   Admin sees ALL orders by default; can filter by ?status=...
   Returns cancelledCount for dashboard
======================= */
router.get('/', auth, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get sort parameters from query
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    // Build filter object - admin sees ALL orders unless they pass status
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Count cancelled orders across all orders
    const cancelledCount = await Order.countDocuments({ status: 'cancelled' });

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      cancelledCount,
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ADMIN: STATS ENDPOINT
   Returns the Stats doc (totalRevenue, totalOrders, cancelledOrders)
======================= */
router.get('/admin/stats', auth, admin, async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ADMIN: GET ORDER BY ID
======================= */
router.get('/admin/:id', auth, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Admin fetch order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ADMIN: UPDATE ORDER STATUS
   (ship / deliver)
======================= */

// Mark order as shipped
router.put('/:id/ship', auth, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'shipped';
    order.trackingNumber = req.body.trackingNumber || `TRK${Date.now()}`;
    order.shippedAt = Date.now();
    await order.save();

    // Send shipped email
    try {
      const itemsHtml = generateOrderItemsHTML(order.orderItems);
      const emailContent = `
        <p>Hi ${order.user.name},</p>
        <p>Good news! Your order #${order._id.toString().slice(-8).toUpperCase()} is on its way.</p>
        <p style="text-align: center; font-size: 18px; font-weight: 600; color: #333; margin: 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <strong>Tracking Number:</strong> ${order.trackingNumber}
        </p>
        
        <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">Items Shipped</h3>
        ${itemsHtml}
        
        <p style="margin-top: 30px;">You can track your package using the tracking number above.</p>
      `;
      
      const emailHtml = wrapEmail('🚚 Your Order Has Shipped!', emailContent);
      
      const textFallback = `
        Your order #${order._id.toString().slice(-8).toUpperCase()} has shipped!
        Tracking Number: ${order.trackingNumber}
        Items:
        ${order.orderItems.map(item => `- ${item.name} (Qty: ${item.qty})`).join('\n')}
      `;
      await sendEmail(
        order.user.email,
        `Your Order Has Shipped! - #${order._id.toString().slice(-8).toUpperCase()}`,
        emailHtml,
        textFallback
      );
    } catch (emailError) {
      console.error('Error sending shipped email:', emailError);
    }

    res.json({ message: 'Order marked as shipped', order });
  } catch (error) {
    console.error('Error marking order shipped:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark order as delivered
router.put('/:id/deliver', auth, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'delivered';
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    await order.save();

    // Send delivered email
    try {
      const itemsHtml = generateOrderItemsHTML(order.orderItems);
      const emailContent = `
        <p>Hi ${order.user.name},</p>
        <p>Your order #${order._id.toString().slice(-8).toUpperCase()} has been successfully delivered.</p>
        
        <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">Items Delivered</h3>
        ${itemsHtml}
        
        <p style="margin-top: 30px;">Thank you for shopping with MarketSphere! We hope to see you again soon.</p>
      `;
      
      const emailHtml = wrapEmail('📦 Your Order Has Been Delivered!', emailContent);
      
      const textFallback = `
        Your order #${order._id.toString().slice(-8).toUpperCase()} has been delivered!
        Items:
        ${order.orderItems.map(item => `- ${item.name} (Qty: ${item.qty})`).join('\n')}
        Thank you for shopping with MarketSphere!
      `;
      await sendEmail(
        order.user.email,
        `Your Order Was Delivered! - #${order._id.toString().slice(-8).toUpperCase()}`,
        emailHtml,
        textFallback
      );
    } catch (emailError) {
      console.error('Error sending delivered email:', emailError);
    }

    res.json({ message: 'Order marked as delivered', order });
  } catch (error) {
    console.error('Error marking order delivered:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   CANCEL ORDER (admin OR owner)
   - unified route: admin can cancel any order
   - user can cancel their own order (only if NOT delivered and not already cancelled)
   - stock is restored for non-delivered orders
   - email is sent to the order user
   - stats updated: totalRevenue -= order.totalPrice, cancelledOrders += 1
======================= */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Authorization:
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdminUser = !!req.user.isAdmin;

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Prevent cancelling delivered or already cancelled
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered orders' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Restore stock only if order hasn't been delivered (i.e. not delivered)
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
    }

    order.status = 'cancelled';
    await order.save();

    // UPDATE STATS (decrease revenue, increase cancelled count)
    try {
      const stats = await getStats();
      stats.totalRevenue -= Number(order.totalPrice || 0);
      // prevent negative revenue
      if (stats.totalRevenue < 0) stats.totalRevenue = 0;
      stats.cancelledOrders += 1;
      await stats.save();
    } catch (statsErr) {
      console.error('Failed to update stats on cancellation:', statsErr);
      // don't fail the cancellation if stats update fails
    }

    // Send cancelled email
    try {
      const itemsHtml = generateOrderItemsHTML(order.orderItems);
      const emailContent = `
        <p>Hi ${order.user.name},</p>
        <p>Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled${isAdminUser && req.user._id.toString() !== order.user._id.toString() ? ' by an administrator' : ''}.</p>
        <p>If you've already been charged, a refund will be processed shortly. If this was a mistake, please contact our support team immediately.</p>
        
        <h3 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">Cancelled Items</h3>
        ${itemsHtml}
        
        <p style="margin-top: 30px;">We're sorry for any inconvenience.</p>
      `;

      const emailHtml = wrapEmail('🚫 Your Order Has Been Cancelled', emailContent);

      const textFallback = `
        Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled.
        If this was a mistake, please contact support.
        Cancelled Items:
        ${order.orderItems.map(item => `- ${item.name} (Qty: ${item.qty})`).join('\n')}
      `;
      await sendEmail(
        order.user.email,
        `Order Cancelled - #${order._id.toString().slice(-8).toUpperCase()}`,
        emailHtml,
        textFallback
      );
    } catch (emailError) {
      console.error('Error sending cancelled email:', emailError);
      // don't fail cancellation if email fails
    }

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

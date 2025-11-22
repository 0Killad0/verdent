import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const ShippingInfo = () => {
  const shippingMethods = [
    {
      name: "Standard Shipping",
      time: "3-5 business days",
      cost: "₹99 (Free on orders over ₹2000)",
      description: "Our most popular shipping option with reliable delivery times"
    },
    {
      name: "Express Shipping",
      time: "1-2 business days",
      cost: "₹199",
      description: "Get your eco-friendly products faster with priority processing"
    },
    {
      name: "Same Day Delivery",
      time: "Same day (Order before 12 PM)",
      cost: "₹299",
      description: "Available in select metropolitan areas"
    }
  ];

  const coveredCities = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Kochi"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-blue-50">
      {/* Header Section */}
      <section className="relative py-16 bg-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            Shipping Information
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            Fast, reliable, and eco-friendly delivery for your sustainable products
          </motion.p>
        </div>
      </section>

      {/* Shipping Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            {/* Eco Packaging */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Eco-Friendly Packaging</h2>
                  <p className="text-gray-600 mt-2">Sustainable packaging that protects your products and our planet</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: "📦",
                    title: "Recycled Cardboard",
                    description: "100% recycled and recyclable cardboard boxes"
                  },
                  {
                    icon: "🍃",
                    title: "Biodegradable Fillers",
                    description: "Cornstarch peanuts and paper-based cushioning"
                  },
                  {
                    icon: "🌿",
                    title: "Plant-Based Ink",
                    description: "Natural, non-toxic inks for all labels and packaging"
                  },
                  {
                    icon: "📄",
                    title: "Minimal Packaging",
                    description: "Reduced packaging materials to minimize waste"
                  }
                ].map((item, index) => (
                  <div key={index} className="text-center p-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Methods */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 font-serif text-center">Shipping Methods</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {shippingMethods.map((method, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl">🚚</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.name}</h3>
                    <p className="text-gray-600 mb-3">{method.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Delivery Time:</strong> {method.time}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Cost:</strong> {method.cost}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Processing & Delivery */}
            <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Processing</h3>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Order Placed", description: "We receive your order and begin processing" },
                    { step: "2", title: "Order Confirmed", description: "We verify stock and prepare your items" },
                    { step: "3", title: "Items Packed", description: "Your order is carefully packed with eco-friendly materials" },
                    { step: "4", title: "Order Shipped", description: "We hand over to our delivery partners" },
                    { step: "5", title: "Out for Delivery", description: "Your order is on its way to you" }
                  ].map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Delivery Coverage</h3>
                <p className="text-gray-600 mb-4">
                  We currently deliver to all major cities and towns across India. 
                  Some remote locations may have extended delivery times.
                </p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Major Cities Covered:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {coveredCities.map((city, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Delivery times may vary during festivals, sales, 
                    and adverse weather conditions. We appreciate your understanding.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tracking & Support */}
            <motion.div variants={fadeUp} className="bg-blue-50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Track Your Order</h3>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Once your order ships, you'll receive a tracking number via email and SMS. 
                You can track your package in real-time through our order tracking system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                >
                  Need Help with Shipping?
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors duration-300"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ShippingInfo;
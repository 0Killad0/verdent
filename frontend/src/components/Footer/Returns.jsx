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

const Returns = () => {
  const returnSteps = [
    {
      step: "1",
      title: "Contact Support",
      description: "Reach out to our support team within 30 days of delivery",
      icon: "📞"
    },
    {
      step: "2",
      title: "Get Return Label",
      description: "We'll email you a prepaid return label and instructions",
      icon: "🏷️"
    },
    {
      step: "3",
      title: "Pack Your Items",
      description: "Securely pack the items with original packaging and tags",
      icon: "📦"
    },
    {
      step: "4",
      title: "Drop Off",
      description: "Drop the package at the designated shipping location",
      icon: "🚚"
    },
    {
      step: "5",
      title: "Receive Refund",
      description: "Get your refund processed within 5-7 business days",
      icon: "💰"
    }
  ];

  const nonReturnableItems = [
    "Personal care products (for hygiene reasons)",
    "Customized or personalized items",
    "Items marked as 'Final Sale'",
    "Products without original tags and packaging",
    "Used or damaged items (unless defective)"
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
            Returns & Exchange
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            Easy returns and exchanges for your complete satisfaction
          </motion.p>
        </div>
      </section>

      {/* Returns Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            {/* Policy Overview */}
            <motion.div
              variants={fadeUp}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">30-Day Return Window</h3>
                <p className="text-gray-600">
                  Return most items within 30 days of delivery for a full refund
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Exchanges</h3>
                <p className="text-gray-600">
                  Exchange for different sizes or colors, subject to availability
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Returns</h3>
                <p className="text-gray-600">
                  Free return shipping on all eligible returns and exchanges
                </p>
              </div>
            </motion.div>

            {/* Return Process */}
            <motion.div variants={fadeUp}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 font-serif text-center">Easy Return Process</h2>
              <div className="grid md:grid-cols-5 gap-4">
                {returnSteps.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                      <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                        {step.step}
                      </div>
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl">{step.icon}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Conditions & Requirements */}
            <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Return Conditions</h3>
                <div className="space-y-3">
                  {[
                    "Items must be unused and in original condition",
                    "All original tags and labels must be attached",
                    "Original packaging must be included",
                    "Proof of purchase (order number) required",
                    "Return must be initiated within 30 days of delivery"
                  ].map((condition, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Non-Returnable Items</h3>
                <div className="space-y-3">
                  {nonReturnableItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 text-sm">✗</span>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Refund & Exchange Info */}
            <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Refund Information</h3>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <strong>Processing Time:</strong> 5-7 business days after we receive your return
                  </p>
                  <p className="text-gray-700">
                    <strong>Refund Method:</strong> Original payment method
                  </p>
                  <p className="text-gray-700">
                    <strong>Shipping Costs:</strong> Non-refundable (except for defective items)
                  </p>
                  <p className="text-gray-700">
                    <strong>Restocking Fee:</strong> No restocking fees for eligible returns
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Exchange Policy</h3>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <strong>Timeframe:</strong> 30 days from delivery date
                  </p>
                  <p className="text-gray-700">
                    <strong>Availability:</strong> Subject to stock availability
                  </p>
                  <p className="text-gray-700">
                    <strong>Price Differences:</strong> You pay the difference if exchanging for a higher-priced item
                  </p>
                  <p className="text-gray-700">
                    <strong>Refund:</strong> We refund the difference if exchanging for a lower-priced item
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Defective Items */}
            <motion.div variants={fadeUp} className="bg-yellow-50 rounded-xl p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Defective or Damaged Items</h3>
                  <p className="text-gray-700 mb-4">
                    If you receive a defective or damaged item, please contact us within 7 days of delivery. 
                    We'll arrange for a free return and send you a replacement immediately.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                  >
                    Report a Defective Item
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="text-center">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Start a Return?</h3>
                <p className="text-gray-600 mb-6">
                  Have your order number ready and contact our support team to initiate your return or exchange.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/contact"
                    className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                  >
                    Start Return Process
                  </Link>
                  <Link
                    to="/shipping"
                    className="inline-flex items-center border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300"
                  >
                    View Shipping Info
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Returns;
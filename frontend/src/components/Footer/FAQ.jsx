import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const FAQ = () => {
  const [openCategory, setOpenCategory] = useState('general');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqData = {
    general: [
      {
        question: "What is Verdant's mission?",
        answer: "Verdant is committed to providing sustainable, eco-friendly products that help reduce environmental impact while delivering exceptional quality and customer experience. We partner with certified sustainable suppliers and local artisans to bring you products that are good for you and the planet."
      },
      {
        question: "Where are your products sourced from?",
        answer: "We source our products from certified sustainable suppliers and local artisans across India who share our commitment to environmental responsibility and ethical practices. All our suppliers undergo a rigorous vetting process to ensure they meet our sustainability standards."
      },
      {
        question: "Do you offer international shipping?",
        answer: "Currently, we ship within India only. We're working on expanding our shipping capabilities to serve international customers in the near future. Please check back later or contact us for specific international shipping inquiries."
      },
      {
        question: "Are your packaging materials eco-friendly?",
        answer: "Yes! We use 100% recycled cardboard boxes, biodegradable cornstarch peanuts for cushioning, plant-based inks for labels, and minimal packaging to reduce waste. Our packaging is designed to be either reusable, recyclable, or compostable."
      }
    ],
    products: [
      {
        question: "Are all your products eco-friendly?",
        answer: "Yes, every product in our collection is carefully selected for its sustainable attributes. This includes products made from recycled materials, biodegradable components, organic materials, or those that support environmental causes through our partnership programs."
      },
      {
        question: "How do I care for my Verdant products?",
        answer: "Care instructions vary by product type. Please refer to the specific product page for detailed care instructions. Generally, we recommend gentle cleaning with eco-friendly products, avoiding harsh chemicals, and following any specific material care guidelines provided."
      },
      {
        question: "Do you offer custom or bulk orders?",
        answer: "Yes! We welcome custom and bulk orders for businesses, events, and special occasions. Please contact our wholesale team through the contact form with your requirements, and we'll work with you to create the perfect sustainable solution for your needs."
      },
      {
        question: "How can I verify the sustainability of your products?",
        answer: "Each product page includes detailed information about its sustainable attributes, including materials used, manufacturing processes, and any certifications. We're transparent about our supply chain and happy to provide additional information upon request."
      }
    ],
    orders: [
      {
        question: "How can I track my order?",
        answer: "Once your order ships, you'll receive a tracking number via email and SMS. You can track your order by logging into your account and visiting the 'Order History' section, or by using the tracking link provided in your shipping confirmation email."
      },
      {
        question: "Can I modify or cancel my order?",
        answer: "Orders can be modified or cancelled within 1 hour of placement. Please contact us immediately if you need to make changes to your order. After 1 hour, orders enter our processing system and cannot be modified, but you can return items after delivery if needed."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit/debit cards, UPI payments, net banking, and popular digital wallets including PhonePe, Google Pay, and Paytm. All payments are processed securely through encrypted channels to protect your information."
      },
      {
        question: "Do you offer cash on delivery?",
        answer: "Yes, we offer cash on delivery for orders up to ₹5000. For orders above this amount, prepayment is required. COD charges may apply depending on your location."
      }
    ],
    shipping: [
      {
        question: "How long does shipping take?",
        answer: "Standard shipping takes 3-5 business days, express shipping takes 1-2 business days, and same-day delivery is available in select metropolitan areas for orders placed before 12 PM. Processing time is 1-2 business days before shipping."
      },
      {
        question: "Do you ship to all locations in India?",
        answer: "We ship to all major cities and towns across India. Some remote locations may have extended delivery times. During checkout, you can enter your pin code to check delivery availability and estimated delivery time for your area."
      },
      {
        question: "What happens if I'm not available during delivery?",
        answer: "Our delivery partners will attempt delivery twice. If unavailable both times, they'll leave a notification with instructions for pickup from the nearest delivery hub. You can also reschedule delivery through the tracking link provided."
      },
      {
        question: "Is shipping free?",
        answer: "We offer free standard shipping on all orders over ₹2000. For orders below ₹2000, standard shipping is ₹99. Express and same-day delivery options are available at additional costs."
      }
    ],
    returns: [
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for most items. Products must be unused, in original condition with tags attached, and in original packaging. Some items like personal care products and customized items are non-returnable for hygiene reasons."
      },
      {
        question: "How do I start a return?",
        answer: "Contact our support team with your order number and reason for return. We'll email you a prepaid return label and instructions. Pack the items securely, attach the label, and drop off at the designated shipping location."
      },
      {
        question: "How long do refunds take?",
        answer: "Refunds are processed within 5-7 business days after we receive and inspect your return. The refund will be issued to your original payment method. You'll receive an email confirmation once the refund is processed."
      },
      {
        question: "Can I exchange an item?",
        answer: "Yes, we're happy to exchange items for a different size or color, subject to availability. If the exchange item costs more, you'll need to pay the difference. If it costs less, we'll refund the difference."
      }
    ]
  };

  const categories = [
    { id: 'general', name: 'General', icon: '❓' },
    { id: 'products', name: 'Products', icon: '🌿' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'shipping', name: 'Shipping', icon: '🚚' },
    { id: 'returns', name: 'Returns', icon: '🔄' }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

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
            FAQ
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            Find answers to commonly asked questions about Verdant
          </motion.p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-col lg:flex-row gap-8"
          >
            {/* Categories Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-8">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Categories</h3>
                  <nav className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setOpenCategory(category.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                          openCategory === category.id
                            ? 'bg-green-100 text-green-900 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-serif">
                  {categories.find(cat => cat.id === openCategory)?.name} Questions
                </h2>
                <p className="text-gray-600 mb-8">
                  Find answers to common questions about {categories.find(cat => cat.id === openCategory)?.name.toLowerCase()}
                </p>

                <div className="space-y-4">
                  {faqData[openCategory].map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <span className="font-medium text-gray-900 text-lg pr-4">{faq.question}</span>
                        <span className={`transform transition-transform duration-200 flex-shrink-0 ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}>
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Still Have Questions */}
                <div className="mt-12 bg-green-50 rounded-lg p-8 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Still have questions?</h3>
                  <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                    Can't find the answer you're looking for? Our friendly support team is here to help you with any questions about our products, orders, or sustainability practices.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/contact"
                      className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                    >
                      Contact Support
                    </Link>
                    <a
                      href="mailto:support@verdant.com"
                      className="inline-flex items-center border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-white transition-colors duration-300"
                    >
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
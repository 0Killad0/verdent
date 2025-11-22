import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex-shrink-0 flex items-end group"> {/* Changed to items-end */}
                <img 
                  src={logo} 
                  alt="Verdant Logo" 
                  className="h-12 w-auto transform translate-y-[-1px] translate-x-[15px]" // Fine-tune positioning
                />
                <span className="text-3xl font-light font-serif text-white group-hover:text-green-700 transition-colors leading-none">
                  erdant
                </span>
              </Link>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Discover sustainable products inspired by nature's diverse ecosystems. Quality craftsmanship meets environmental responsibility.
            </p>
            <div className="flex space-x-3">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors duration-300 group"
                >
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Explore</h3>
            <ul className="space-y-2">
              {[
                { name: 'All Products', path: '/products' },
                { name: 'Electronics', path: '/products?category=Electronics' },
                { name: 'Cup', path: '/products?category=Cup' },
                { name: 'Home & Kitchen', path: '/products?category=Home+%26+Kitchen' },
                { name: 'Nature Books', path: '/products?category=Books' }
              ].map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="text-gray-300 hover:text-white transition-colors duration-300 text-sm py-1 block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2">
              {[
                { name: 'Contact Us', path: '/contact' },
                { name: 'Shipping Info', path: '/shippinginfo' },
                { name: 'Returns & Exchanges', path: '/returns' },
                { name: 'FAQ', path: '/faq' },
                { name: 'Size Guide', path: '/size-guide' }
              ].map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="text-gray-300 hover:text-white transition-colors duration-300 text-sm py-1 block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Stay Connected</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start space-x-3">
                <svg className="w-4 h-4 mt-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <div>
                  <p className="font-medium text-sm text-white">Visit Our Store</p>
                  <p className="text-xs">123 Forest Avenue<br />Kerala, OR 97205</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <div>
                  <p className="font-medium text-sm text-white">Email Us</p>
                  <p className="text-xs">support@Verdant.com</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <div>
                  <p className="font-medium text-sm text-white">Call Us</p>
                  <p className="text-xs">(555) 123-4567</p>
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="font-medium mb-2 text-white text-sm">Get Updates</p>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  <button className="px-3 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors duration-300 text-sm">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 text-gray-400 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Proudly sustainable since 2024</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
              <span>Carbon Neutral</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center lg:justify-end space-x-4 text-xs">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'].map((item, index) => (
              <a
                key={index}
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-300 mb-2 lg:mb-0"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-xs">
            © 2025 Verdant. Crafted with care for a better planet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
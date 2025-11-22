import React from "react";
import { motion } from "framer-motion";
import logo from '../../assets/logo.png';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-950 via-emerald-900 to-teal-800 z-[9999] space-y-8"
    >
      {/* Logo + Text inline */}
      <div className="flex items-center space-x-2">
        <img 
          src={logo} 
          alt="V" 
          className="h-12 w-auto transform translate-y-[-10px] translate-x-[15px]"
        />
        <span className="text-3xl font-light font-serif text-gray-900 transition-colors leading-none">
          erdant
        </span>
      </div>

      {/* Animated Loading Bar */}
      <motion.div
        className="w-64 h-[2px] bg-green-800 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-lime-300 via-emerald-300 to-green-500"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;

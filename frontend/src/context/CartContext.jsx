import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        cartItems: action.payload || []
      };
    case 'ADD_TO_CART':
      const existingItem = state.cartItems.find(
        item => item.product === action.payload.product
      );

      if (existingItem) {
        const updatedItems = state.cartItems.map(item =>
          item.product === action.payload.product
            ? { ...item, qty: item.qty + action.payload.qty }
            : item
        );
        
        // Check if quantity exceeds stock
        const itemToCheck = updatedItems.find(item => item.product === action.payload.product);
        if (itemToCheck.qty > itemToCheck.countInStock) {
          return state; // Don't update if exceeds stock
        }

        return {
          ...state,
          cartItems: updatedItems
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, action.payload]
        };
      }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.product !== action.payload)
      };

    case 'UPDATE_QTY':
      const updatedItems = state.cartItems.map(item =>
        item.product === action.payload.product
          ? { ...item, qty: action.payload.qty }
          : item
      );

      // Check if quantity is valid
      const itemToCheck = updatedItems.find(item => item.product === action.payload.product);
      if (itemToCheck && itemToCheck.qty > itemToCheck.countInStock) {
        return state; // Don't update if exceeds stock
      }

      return {
        ...state,
        cartItems: updatedItems.filter(item => item.qty > 0)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: []
      };

    default:
      return state;
  }
};

const initialState = {
  cartItems: []
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('marketsphereCart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('marketsphereCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('marketsphereCart', JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  // Helper function to calculate current price based on offer
  const calculateCurrentPrice = (product) => {
    // Check if offer is valid
    const isOfferValid = product.offer?.active && 
      (!product.offer.validUntil || new Date(product.offer.validUntil) > new Date());
    
    if (isOfferValid && product.offer.offerPrice > 0) {
      return product.offer.offerPrice;
    }
    return product.price;
  };

  // Helper function to get original price
  const getOriginalPrice = (product) => {
    return product.originalPrice || product.price;
  };

  const addToCart = (product, qty = 1) => {
    if (qty > product.stock) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }

    const currentPrice = calculateCurrentPrice(product);
    const originalPrice = getOriginalPrice(product);

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product: product._id,
        name: product.name,
        image: product.images?.[0] ? `/api/images/${product.images[0]._id || product.images[0]}` : '/api/placeholder/300/300',
        price: product.price, // Base price
        originalPrice: originalPrice, // Original price for display
        cartPrice: currentPrice, // Actual price to charge (with offer if applicable)
        qty,
        countInStock: product.stock,
        offer: product.offer ? { ...product.offer } : null // Store offer data
      }
    });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({
        type: 'UPDATE_QTY',
        payload: { product: productId, qty }
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // FIXED: Use cartPrice instead of price for calculations
  const getCartTotal = () => {
    return state.cartItems.reduce((total, item) => {
      const itemPrice = item.cartPrice || item.price;
      return total + (itemPrice * item.qty);
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.cartItems.reduce((total, item) => total + item.qty, 0);
  };

  const getCartItem = (productId) => {
    return state.cartItems.find(item => item.product === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        getCartItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
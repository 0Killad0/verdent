import express from 'express';
import User from '../models/User.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        addresses: updatedUser.addresses
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add or update user address
router.post('/addresses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, street, city, state, zipCode, country, isDefault } = req.body;

    const newAddress = {
      name,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false
    };

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    // If no addresses exist, set this as default
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user address
router.put('/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, street, city, state, zipCode, country, isDefault } = req.body;

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    address.name = name || address.name;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.country = country || address.country;

    // If setting as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === req.params.addressId;
      });
    } else if (address.isDefault) {
      // If removing default from current default, set first other address as default
      const otherAddress = user.addresses.find(addr => 
        addr._id.toString() !== req.params.addressId
      );
      if (otherAddress) {
        otherAddress.isDefault = true;
      }
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user address
router.delete('/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.addresses = user.addresses.filter(
      address => address._id.toString() !== req.params.addressId
    );

    // If we deleted the default address and there are other addresses, set a new default
    if (user.addresses.length > 0 && !user.addresses.find(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all users (Admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role (Admin only)
router.put('/:id/role', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.role = req.body.role;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
import { validationResult } from 'express-validator';
import {
  getUserById as getUserByIdRepo,
  updateUser as updateUserRepo
} from '../repositories/userRepository.js';
import { getStoreById } from '../repositories/storeRepository.js';

const respondValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
    return true;
  }
  return false;
};

export const getSelectedStore = async (req, res) => {
  try {
    const userId = req.user?._id ?? req.user?.id;
    const user = await getUserByIdRepo(userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        selectedStore: user.selectedStore || null
      }
    });
  } catch (error) {
    console.error('Get selected store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting selected store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const setSelectedStore = async (req, res) => {
  try {
    if (respondValidationErrors(req, res)) return;

    const userId = req.user?._id ?? req.user?.id;
    const { storeId } = req.body;

    let store = null;
    let selectedStoreId = null;

    if (storeId !== null && storeId !== undefined && storeId !== '') {
      const numericId = Number(storeId);
      store = await getStoreById(numericId);
      if (!store) {
        return res.status(404).json({
          status: 'error',
          message: 'Store not found'
        });
      }
      selectedStoreId = numericId;
    }

    const user = await updateUserRepo(userId, { selectedStoreId });

    res.json({
      status: 'success',
      message: selectedStoreId ? 'Selected store updated successfully' : 'Selected store cleared',
      data: {
        user,
        selectedStore: store
      }
    });
  } catch (error) {
    console.error('Set selected store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while setting selected store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


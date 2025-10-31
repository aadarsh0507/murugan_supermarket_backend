import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import Store from '../models/Store.js';
import { validationResult } from 'express-validator';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
export const getAllSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive = true,
      storeId = null
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } },
        { 'contactPerson.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'phone.primary': { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    // Filter by store if storeId is provided
    if (storeId) {
      query['stores.store'] = storeId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const suppliers = await Supplier.find(query)
      .populate({
        path: 'stores.store',
        select: 'name code address'
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate({
        path: 'stores.store',
        select: 'name code address phone email'
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin/Manager)
export const createSupplier = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      stores,
      gstNumber,
      panNumber,
      bankDetails,
      creditLimit,
      paymentTerms,
      isActive,
      notes
    } = req.body;

    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    // Validate stores if provided
    if (stores && stores.length > 0) {
      for (const storeItem of stores) {
        const store = await Store.findById(storeItem.store);
        if (!store) {
          return res.status(400).json({
            success: false,
            message: `Store with ID ${storeItem.store} not found`
          });
        }
      }
    }

    const supplierData = {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      stores: stores || [],
      gstNumber,
      panNumber,
      bankDetails,
      creditLimit: creditLimit || 0,
      paymentTerms,
      isActive: isActive !== undefined ? isActive : true,
      notes,
      createdBy: req.user.id
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    // Populate the created supplier
    await supplier.populate([
      { path: 'stores.store', select: 'name code address' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin/Manager)
export const updateSupplier = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Validate stores if provided
    if (req.body.stores && req.body.stores.length > 0) {
      for (const storeItem of req.body.stores) {
        const store = await Store.findById(storeItem.store);
        if (!store) {
          return res.status(400).json({
            success: false,
            message: `Store with ID ${storeItem.store} not found`
          });
        }
      }
    }

    // Update fields
    const updateData = { ...req.body, updatedBy: req.user.id };
    Object.assign(supplier, updateData);
    await supplier.save();

    // Populate the updated supplier
    await supplier.populate([
      { path: 'stores.store', select: 'name code address' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle supplier status
// @route   PATCH /api/suppliers/:id/toggle-status
// @access  Private (Admin/Manager)
export const toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.isActive = !supplier.isActive;
    supplier.updatedBy = req.user.id;
    await supplier.save();

    res.json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      data: supplier
    });
  } catch (error) {
    console.error('Error toggling supplier status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling supplier status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add store to supplier
// @route   POST /api/suppliers/:id/stores
// @access  Private (Admin/Manager)
export const addStoreToSupplier = async (req, res) => {
  try {
    const { storeId } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if store is already associated
    const existingStore = supplier.stores.find(s => s.store.toString() === storeId);
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'Store is already associated with this supplier'
      });
    }

    // Add store
    await supplier.addStore(storeId);

    // Populate and return
    await supplier.populate({
      path: 'stores.store',
      select: 'name code address'
    });

    res.json({
      success: true,
      message: 'Store added to supplier successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error adding store to supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding store to supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove store from supplier
// @route   DELETE /api/suppliers/:id/stores/:storeId
// @access  Private (Admin/Manager)
export const removeStoreFromSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.removeStore(req.params.storeId);
    await supplier.populate({
      path: 'stores.store',
      select: 'name code address'
    });

    res.json({
      success: true,
      message: 'Store removed from supplier successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error removing store from supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing store from supplier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all stores
// @route   GET /api/suppliers/stores
// @access  Private
export const getAllStores = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    const stores = await Store.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create store
// @route   POST /api/suppliers/stores
// @access  Private (Admin/Manager)
export const createStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const storeData = {
      ...req.body,
      createdBy: req.user.id
    };

    const store = new Store(storeData);
    await store.save();

    await store.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Error creating store:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Store with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update store
// @route   PUT /api/suppliers/stores/:id
// @access  Private (Admin/Manager)
export const updateStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('updatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStore
    });
  } catch (error) {
    console.error('Error updating store:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Store with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete store
// @route   DELETE /api/suppliers/stores/:id
// @access  Private (Admin)
export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if store is associated with any suppliers
    const Supplier = mongoose.model('Supplier');
    const suppliersWithStore = await Supplier.find({ 'stores.store': req.params.id });

    if (suppliersWithStore.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete store that is associated with suppliers. Please remove the store from all suppliers first.'
      });
    }

    await Store.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk upload suppliers from CSV
// @route   POST /api/suppliers/bulk-upload
// @access  Private (Admin/Manager)
export const bulkUploadSuppliers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const csvFilePath = req.file.path;
    const rawRows = [];
    let rowNumber = 0;

    // First pass: Read all rows from CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          rawRows.push({ row, index: ++rowNumber });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Second pass: Validate and process rows
    const totalSuppliers = [];
    const errors = [];
    const seenEmails = new Set();

    // Get all existing emails to check duplicates
    const existingSuppliers = await Supplier.find({ email: { $exists: true, $ne: null } }, 'email');
    const existingEmails = new Set(existingSuppliers.map(s => (s.email || '').toLowerCase()));

    for (const { row, index } of rawRows) {
      try {
        // Skip empty rows
        if (!row.companyName && !row.email && !row.primaryPhone) {
          continue;
        }

        // Helpers to support multiple header styles and normalize values
        const normalize = (val) => {
          if (val === undefined || val === null) return '';
          const s = String(val).trim();
          if (s.toLowerCase() === 'null' || s.toLowerCase() === 'na' || s === '-') return '';
          return s;
        };

        const getVal = (r, ...keys) => {
          for (const k of keys) {
            if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') {
              return normalize(r[k]);
            }
          }
          return '';
        };

        // Read common fields from either flat or dot-notated headers
        const companyName = getVal(row, 'companyName');
        const contactFirst = getVal(row, 'contactPerson.firstName', 'firstName', 'contactPerson_firstName');
        const contactLast = getVal(row, 'contactPerson.lastName', 'lastName', 'contactPerson_lastName');
        const contactFull = getVal(row, 'contactPerson', 'contact_name');
        const rawEmail = getVal(row, 'email');
        const primaryPhone = getVal(row, 'primaryPhone', 'phone.primary', 'phone_primary');
        const secondaryPhone = getVal(row, 'secondaryPhone', 'phone.secondary', 'phone_secondary');
        const street = getVal(row, 'street', 'address.street', 'address_street');
        const city = getVal(row, 'city', 'address.city', 'address_city');
        const state = getVal(row, 'state', 'address.state', 'address_state');
        const zipCode = getVal(row, 'zipCode', 'address.zipCode', 'address_zipCode', 'address.pincode', 'pincode');
        const country = getVal(row, 'country', 'address.country', 'address_country');
        const designation = getVal(row, 'designation');
        const gstNumberVal = getVal(row, 'gstNumber', 'gst_number');
        const panNumberVal = getVal(row, 'panNumber', 'pan_number');
        const accountNumber = getVal(row, 'accountNumber', 'bank.accountNumber');
        const bankName = getVal(row, 'bankName', 'bank.bankName', 'bank.name');
        const branch = getVal(row, 'branch', 'bank.branch');
        const ifscCode = getVal(row, 'ifscCode', 'bank.ifscCode', 'ifsc');
        const creditLimitStr = getVal(row, 'creditLimit');
        const paymentTerms = getVal(row, 'paymentTerms');
        const isActiveRaw = getVal(row, 'isActive', 'active');
        const notes = getVal(row, 'notes', 'remark', 'remarks');

        const email = rawEmail ? rawEmail.toLowerCase() : '';

        // Check for duplicate email in current batch
        if (email && seenEmails.has(email)) {
          errors.push({
            row: index,
            error: 'Duplicate email in CSV file',
            data: row
          });
          continue;
        }

        // Check if supplier already exists in database
        if (email && existingEmails.has(email)) {
          errors.push({
            row: index,
            error: 'Supplier with this email already exists in database',
            data: row
          });
          continue;
        }

        // Parse contact person name
        let firstName = contactFirst;
        let lastName = contactLast;
        if (!firstName && contactFull) {
          const parts = contactFull.split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        // Normalize boolean-like values
        const parseBoolean = (value, defaultValue = true) => {
          if (value === undefined || value === null || value === '') return defaultValue;
          const v = String(value).trim().toLowerCase();
          if (['true', '1', 'yes', 'y'].includes(v)) return true;
          if (['false', '0', 'no', 'n'].includes(v)) return false;
          return defaultValue;
        };

        // Build supplier object (only include fields that exist in CSV)
        const supplierData = { createdBy: req.user.id };

        if (companyName) supplierData.companyName = companyName;

        // contactPerson only if present
        const contact = {};
        if (firstName) contact.firstName = firstName;
        if (lastName) contact.lastName = lastName;
        if (designation) contact.designation = designation;
        if (Object.keys(contact).length > 0) supplierData.contactPerson = contact;

        if (email) supplierData.email = email;

        // phone only if any present
        const phone = {};
        if (primaryPhone) phone.primary = primaryPhone;
        if (secondaryPhone) phone.secondary = secondaryPhone;
        if (Object.keys(phone).length > 0) supplierData.phone = phone;

        // address only if any present
        const addr = {};
        if (street) addr.street = street;
        if (city) addr.city = city;
        if (state) addr.state = state;
        if (zipCode) addr.zipCode = zipCode;
        if (country) addr.country = country;
        if (Object.keys(addr).length > 0) supplierData.address = addr;

        // identifiers and bank
        if (gstNumberVal) supplierData.gstNumber = gstNumberVal.toUpperCase();
        if (panNumberVal) supplierData.panNumber = panNumberVal.toUpperCase();
        const bank = {};
        if (accountNumber) bank.accountNumber = accountNumber;
        if (bankName) bank.bankName = bankName;
        if (branch) bank.branch = branch;
        if (ifscCode) bank.ifscCode = ifscCode.toUpperCase();
        if (Object.keys(bank).length > 0) supplierData.bankDetails = bank;

        if (creditLimitStr && String(creditLimitStr).trim() !== '') supplierData.creditLimit = parseFloat(creditLimitStr);
        if (paymentTerms) supplierData.paymentTerms = paymentTerms;
        supplierData.isActive = parseBoolean(isActiveRaw, true);
        if (notes) supplierData.notes = notes;
        supplierData.stores = [];

        totalSuppliers.push(supplierData);
        if (email) seenEmails.add(email);
      } catch (error) {
        errors.push({
          row: index,
          error: error.message,
          data: row
        });
      }
    }

    // Delete uploaded file
    fs.unlinkSync(csvFilePath);

    // If there are only errors and no valid suppliers
    if (totalSuppliers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid suppliers found in CSV file',
        errors: errors
      });
    }

    // Insert using native collection to bypass Mongoose validations for bulk upload
    const insertResult = await Supplier.collection.insertMany(totalSuppliers, { ordered: false });
    const insertedIds = Object.values(insertResult.insertedIds || {});

    // Populate created suppliers
    const populatedSuppliers = insertedIds.length
      ? await Supplier.find({ _id: { $in: insertedIds } }).populate('createdBy', 'firstName lastName')
      : [];

    res.status(201).json({
      success: true,
      message: `Bulk upload completed. ${populatedSuppliers.length} supplier(s) created successfully.`,
      data: {
        totalRows: rawRows.length,
        successCount: populatedSuppliers.length,
        errorCount: errors.length,
        suppliers: populatedSuppliers,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);

    // Delete uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing bulk upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// import { Op, UniqueConstraintError } from 'sequelize';
// import { sequelize } from '../db/index.js';
// import { Supplier, Store } from '../models/index.js';

// const storeInclude = {
//   model: Store,
//   as: 'stores',
//   attributes: ['id', 'storeCode', 'name', 'addressCity'],
//   through: { attributes: [] }
// };

// const defaultExtraData = {
//   contactPerson: null,
//   secondaryPhone: null,
//   panNumber: null,
//   bankDetails: null,
//   creditLimit: 0,
//   paymentTerms: null,
//   notes: null
// };

// const mapSupplierInstance = (supplier) => {
//   if (!supplier) {
//     return null;
//   }

//   const extra = {
//     ...defaultExtraData,
//     ...(supplier.extraData || {})
//   };

//   return {
//     id: supplier.id,
//     supplierCode: supplier.supplierCode,
//     companyName: supplier.name,
//     email: supplier.email,
//     phone: {
//       primary: supplier.phone || null,
//       secondary: extra.secondaryPhone || null
//     },
//     contactPerson: extra.contactPerson || null,
//     address: {
//       street: supplier.addressStreet,
//       city: supplier.addressCity,
//       state: supplier.addressState,
//       zipCode: supplier.addressZipCode,
//       country: supplier.addressCountry
//     },
//     gstNumber: supplier.gstin,
//     panNumber: extra.panNumber || null,
//     bankDetails: extra.bankDetails || null,
//     creditLimit: extra.creditLimit || 0,
//     paymentTerms: extra.paymentTerms || null,
//     notes: extra.notes || null,
//     isActive: supplier.isActive,
//     createdAt: supplier.createdAt,
//     updatedAt: supplier.updatedAt,
//     createdBy: supplier.createdBy,
//     stores: (supplier.stores || []).map((store) => ({
//       id: store.id,
//       name: store.name,
//       code: store.storeCode,
//       city: store.addressCity
//     }))
//   };
// };

// const buildExtraData = (base, updates = {}) => {
//   const merged = {
//     ...defaultExtraData,
//     ...(base || {})
//   };

//   if (updates.contactPerson !== undefined) {
//     merged.contactPerson = updates.contactPerson;
//   }
//   if (updates.secondaryPhone !== undefined) {
//     merged.secondaryPhone = updates.secondaryPhone;
//   }
//   if (updates.panNumber !== undefined) {
//     merged.panNumber = updates.panNumber;
//   }
//   if (updates.bankDetails !== undefined) {
//     merged.bankDetails = updates.bankDetails;
//   }
//   if (updates.creditLimit !== undefined) {
//     merged.creditLimit = Number(updates.creditLimit) || 0;
//   }
//   if (updates.paymentTerms !== undefined) {
//     merged.paymentTerms = updates.paymentTerms;
//   }
//   if (updates.notes !== undefined) {
//     merged.notes = updates.notes;
//   }

//   return merged;
// };

// const normalizeUniqueConstraintError = (error) => {
//   if (error instanceof UniqueConstraintError) {
//     const path = error.errors?.[0]?.path || '';
//     if (path.includes('email')) {
//       const duplicateEmailError = new Error('Supplier with this email already exists');
//       duplicateEmailError.code = 'SUPPLIER_EXISTS';
//       throw duplicateEmailError;
//     }
//     if (path.includes('supplier_code')) {
//       const duplicateCodeError = new Error('Supplier with this code already exists');
//       duplicateCodeError.code = 'SUPPLIER_CODE_EXISTS';
//       throw duplicateCodeError;
//     }
//     const duplicateError = new Error('Supplier already exists with the provided details');
//     duplicateError.code = 'SUPPLIER_EXISTS';
//     throw duplicateError;
//   }

//   throw error;
// };

// const ensureStoresExist = (requestedIds, storeInstances) => {
//   if (!requestedIds?.length) {
//     return;
//   }

//   const foundIds = new Set(storeInstances.map((store) => Number(store.id)));
//   const missing = requestedIds.filter((id) => !foundIds.has(Number(id)));

//   if (missing.length > 0) {
//     const error = new Error(`Store not found: ${missing.join(', ')}`);
//     error.code = 'STORE_NOT_FOUND';
//     throw error;
//   }
// };

// const fetchSupplierWithStores = async (supplierId, transaction) =>
//   Supplier.findByPk(supplierId, {
//     include: [storeInclude],
//     transaction
//   });

// export const listSuppliers = async ({
//   page = 1,
//   limit = 20,
//   search,
//   isActive
// }) => {
//   const offset = (page - 1) * limit;

//   const where = {};
//   if (typeof isActive === 'boolean') {
//     where.isActive = isActive;
//   }
//   if (search) {
//     where[Op.or] = [
//       { name: { [Op.like]: `%${search}%` } },
//       { email: { [Op.like]: `%${search}%` } },
//       { phone: { [Op.like]: `%${search}%` } },
//       { supplierCode: { [Op.like]: `%${search}%` } }
//     ];
//   }

//   const { rows, count } = await Supplier.findAndCountAll({
//     where,
//     include: [storeInclude],
//     order: [['createdAt', 'DESC']],
//     limit,
//     offset
//   });

//   return {
//     suppliers: rows.map(mapSupplierInstance),
//     total: Number(count)
//   };
// };

// export const getSupplierById = async (supplierId) => {
//   const supplier = await fetchSupplierWithStores(supplierId);
//   return mapSupplierInstance(supplier);
// };

// export const createSupplier = async ({
//   supplierCode,
//   companyName,
//   email,
//   phone,
//   contactPerson,
//   address,
//   gstNumber,
//   panNumber,
//   bankDetails,
//   creditLimit,
//   paymentTerms,
//   isActive = true,
//   notes,
//   stores = [],
//   createdBy
// }) => {
//   try {
//     const newSupplier = await sequelize.transaction(async (transaction) => {
//       const extraData = buildExtraData(null, {
//         contactPerson,
//         secondaryPhone: phone?.secondary,
//         panNumber,
//         bankDetails,
//         creditLimit,
//         paymentTerms,
//         notes
//       });

//       const supplier = await Supplier.create(
//         {
//           supplierCode,
//           name: companyName,
//           email,
//           phone: phone?.primary || null,
//           gstin: gstNumber || null,
//           addressStreet: address?.street || null,
//           addressCity: address?.city || null,
//           addressState: address?.state || null,
//           addressZipCode: address?.zipCode || null,
//           addressCountry: address?.country || 'India',
//           isActive,
//           createdBy: createdBy || null,
//           extraData
//         },
//         { transaction }
//       );

//       if (stores.length > 0) {
//         const storeInstances = await Store.findAll({
//           where: { id: stores },
//           transaction
//         });
//         ensureStoresExist(stores, storeInstances);
//         await supplier.setStores(storeInstances, { transaction });
//       }

//       return supplier;
//     });

//     const supplierWithAssociations = await fetchSupplierWithStores(newSupplier.id);
//     return mapSupplierInstance(supplierWithAssociations);
//   } catch (error) {
//     normalizeUniqueConstraintError(error);
//   }
// };

// export const updateSupplier = async (supplierId, updates) => {
//   const supplier = await fetchSupplierWithStores(supplierId);
//   if (!supplier) {
//     return null;
//   }

//   try {
//     await sequelize.transaction(async (transaction) => {
//       const nextExtraData = buildExtraData(supplier.extraData, {
//         contactPerson: updates.contactPerson,
//         secondaryPhone: updates.phone?.secondary,
//         panNumber: updates.panNumber,
//         bankDetails: updates.bankDetails,
//         creditLimit: updates.creditLimit,
//         paymentTerms: updates.paymentTerms,
//         notes: updates.notes
//       });

//       const payload = {};
//       if (updates.supplierCode !== undefined) {
//         payload.supplierCode = updates.supplierCode;
//       }
//       if (updates.companyName !== undefined) {
//         payload.name = updates.companyName;
//       }
//       if (updates.phone?.primary !== undefined) {
//         payload.phone = updates.phone.primary || null;
//       }
//       if (updates.email !== undefined) {
//         payload.email = updates.email || null;
//       }
//       if (updates.gstNumber !== undefined) {
//         payload.gstin = updates.gstNumber || null;
//       }
//       if (updates.address) {
//         payload.addressStreet = updates.address.street || null;
//         payload.addressCity = updates.address.city || null;
//         payload.addressState = updates.address.state || null;
//         payload.addressZipCode = updates.address.zipCode || null;
//         payload.addressCountry = updates.address.country || 'India';
//       }
//       if (updates.isActive !== undefined) {
//         payload.isActive = updates.isActive;
//       }

//       payload.extraData = nextExtraData;

//       if (Object.keys(payload).length > 0) {
//         await supplier.update(payload, { transaction });
//       }

//       if (updates.stores) {
//         if (updates.stores.length === 0) {
//           await supplier.setStores([], { transaction });
//         } else {
//           const storeInstances = await Store.findAll({
//             where: { id: updates.stores },
//             transaction
//           });
//           ensureStoresExist(updates.stores, storeInstances);
//           await supplier.setStores(storeInstances, { transaction });
//         }
//       }
//     });
//   } catch (error) {
//     normalizeUniqueConstraintError(error);
//   }

//   const refreshed = await fetchSupplierWithStores(supplierId);
//   return mapSupplierInstance(refreshed);
// };

// export const deleteSupplier = async (supplierId) => {
//   await sequelize.transaction(async (transaction) => {
//     const supplier = await Supplier.findByPk(supplierId, { transaction });
//     if (!supplier) {
//       return;
//     }
//     await supplier.setStores([], { transaction });
//     await supplier.destroy({ transaction });
//   });
// };

// export const toggleSupplierStatus = async (supplierId) => {
//   const supplier = await fetchSupplierWithStores(supplierId);
//   if (!supplier) {
//     return null;
//   }

//   supplier.isActive = !supplier.isActive;
//   await supplier.save();

//   return mapSupplierInstance(await fetchSupplierWithStores(supplierId));
// };

// export const addStoreToSupplier = async (supplierId, storeId) => {
//   const supplier = await fetchSupplierWithStores(supplierId);
//   if (!supplier) {
//     return null;
//   }

//   const store = await Store.findByPk(storeId);
//   if (!store) {
//     const error = new Error('Store not found');
//     error.code = 'STORE_NOT_FOUND';
//     throw error;
//   }

//   const alreadyLinked = supplier.stores?.some((existing) => Number(existing.id) === Number(storeId));
//   if (alreadyLinked) {
//     const error = new Error('Store is already associated with this supplier');
//     error.code = 'STORE_EXISTS';
//     throw error;
//   }

//   await supplier.addStore(store);
//   const refreshed = await fetchSupplierWithStores(supplierId);
//   return mapSupplierInstance(refreshed);
// };

// export const removeStoreFromSupplier = async (supplierId, storeId) => {
//   const supplier = await fetchSupplierWithStores(supplierId);
//   if (!supplier) {
//     return null;
//   }

//   const store = await Store.findByPk(storeId);
//   if (store) {
//     await supplier.removeStore(store);
//   }

//   const refreshed = await fetchSupplierWithStores(supplierId);
//   return mapSupplierInstance(refreshed);
// };



import Supplier from './Supplier.js';
import Store from './Store.js';
import User from './User.js';
import Role from './Role.js';
import Department from './Department.js';
import Bill from './Bill.js';

User.belongsToMany(Store, {
    through: 'user_stores',
    as: 'stores',
    foreignKey: 'user_id',
    otherKey: 'store_id'
});

Store.belongsToMany(User, {
    through: 'user_stores',
    as: 'users',
    foreignKey: 'store_id',
    otherKey: 'user_id'
});

User.belongsTo(Store, {
    foreignKey: { name: 'selectedStoreId', field: 'selected_store_id' },
    as: 'selectedStore'
});

Store.hasMany(User, {
    foreignKey: { name: 'selectedStoreId', field: 'selected_store_id' },
    as: 'selectedStoreUsers'
});

User.belongsTo(User, {
    foreignKey: { name: 'createdBy', field: 'created_by' },
    as: 'creator'
});

User.hasMany(User, {
    foreignKey: { name: 'createdBy', field: 'created_by' },
    as: 'createdUsers'
});

export { Supplier, Store, User, Role, Department, Bill };

export default {
    Supplier,
    Store,
    User,
    Role,
    Department,
    Bill
};


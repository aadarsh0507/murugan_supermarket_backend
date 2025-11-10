import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const SupplierStore = sequelize.define(
    'SupplierStore',
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        supplierId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'supplier_id'
        },
        storeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'store_id'
        },
        priority: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'priority'
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_primary',
            get() {
                const rawValue = this.getDataValue('isPrimary');
                return Boolean(rawValue);
            },
            set(value) {
                this.setDataValue('isPrimary', value ? 1 : 0);
            }
        }
    },
    {
        tableName: 'supplier_stores',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['supplier_id', 'store_id']
            }
        ]
    }
);

export default SupplierStore;



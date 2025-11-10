import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Bill = sequelize.define(
    'Bill',
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        billNo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'bill_no'
        },
        storeId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'store_id'
        },
        userId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'user_id'
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'date'
        },
        customerId: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'customer_id'
        },
        customerName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'customer_name'
        },
        customerPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'customer_phone'
        },
        customerEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'customer_email'
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'card', 'upi', 'credit', 'other'),
            allowNull: false,
            defaultValue: 'cash',
            field: 'payment_method'
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded'),
            allowNull: false,
            defaultValue: 'paid',
            field: 'payment_status'
        },
        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'subtotal'
        },
        tax: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'tax'
        },
        discount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'discount'
        },
        total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'total'
        }
    },
    {
        tableName: 'bills',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Bill;


import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Department = sequelize.define(
    'Department',
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'department_name'
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'description'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active',
            get() {
                const rawValue = this.getDataValue('isActive');
                return Boolean(rawValue);
            },
            set(value) {
                this.setDataValue('isActive', value ? 1 : 0);
            }
        },
        isSystem: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_system',
            get() {
                const rawValue = this.getDataValue('isSystem');
                return Boolean(rawValue);
            },
            set(value) {
                this.setDataValue('isSystem', value ? 1 : 0);
            }
        }
    },
    {
        tableName: 'departments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default Department;



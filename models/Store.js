import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Store = sequelize.define(
  'Store',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    storeCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'store_code'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email'
    },
    addressStreet: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'address_street'
    },
    addressCity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'address_city'
    },
    addressState: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'address_state'
    },
    addressZipCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'address_zip_code'
    },
    addressCountry: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'India',
      field: 'address_country'
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
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'created_by'
    }
  },
  {
    tableName: 'stores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Store;


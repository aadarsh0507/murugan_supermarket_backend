import Role from '../models/Role.js';
import Department from '../models/Department.js';

const toResponse = (records) =>
  records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    isActive: Boolean(record.isActive),
    isSystem: Boolean(record.isSystem)
  }));

export const listRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      status: 'success',
      data: {
        roles: toResponse(roles)
      }
    });
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch roles'
    });
  }
};

export const listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      status: 'success',
      data: {
        departments: toResponse(departments)
      }
    });
  } catch (error) {
    console.error('List departments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch departments'
    });
  }
};

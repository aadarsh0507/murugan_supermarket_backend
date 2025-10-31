import Bill from '../models/Bill.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';
import mongoose from 'mongoose';

// @desc    Get dashboard statistics for selected store
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    // Get user's selected store - required for filtering
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing dashboard. Go to "Select Store" in the sidebar.'
      });
    }

    const storeId = user.selectedStore._id;

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build base query for bills (completed status only for sales)
    const billQuery = {
      store: storeId,
      status: 'completed'
    };

    // Role-based filtering: employee and cashier can only see their own bills
    if (req.user.role === 'employee' || req.user.role === 'cashier') {
      billQuery.createdBy = req.user._id;
    }

    // Get total sales (all time)
    const totalSalesResult = await Bill.aggregate([
      { $match: billQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    // Get sales for last week
    const lastWeekSalesResult = await Bill.aggregate([
      {
        $match: {
          ...billQuery,
          createdAt: { $gte: lastWeek, $lt: today }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get sales for today
    const todaySalesResult = await Bill.aggregate([
      {
        $match: {
          ...billQuery,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    // Get sales for yesterday
    const yesterdaySalesResult = await Bill.aggregate([
      {
        $match: {
          ...billQuery,
          createdAt: { $gte: yesterday, $lt: today }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get weekly sales (last 7 days by day)
    const weeklySalesData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySales = await Bill.aggregate([
        {
          $match: {
            ...billQuery,
            createdAt: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' }
          }
        }
      ]);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weeklySalesData.push({
        name: dayNames[dayStart.getDay()],
        sales: daySales[0]?.totalSales || 0
      });
    }

    // Get sales by category (simplified - group by item categories)
    // Since category relationships can be complex, we'll create a simplified grouping
    const categorySalesResult = await Bill.aggregate([
      { $match: billQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          others: { $sum: '$items.netAmount' }
        }
      }
    ]);

    // For now, use a simple "Others" category
    // TODO: Implement proper category aggregation when category structure is finalized
    const categoryData = categorySalesResult.length > 0 
      ? [{ name: 'All Sales', value: categorySalesResult[0].others }]
      : [];

    // Get total items count
    const itemQuery = { store: storeId, isActive: true };
    const totalItems = await Item.countDocuments(itemQuery);

    // Get items added this month
    const itemsAddedThisMonth = await Item.countDocuments({
      ...itemQuery,
      createdAt: { $gte: startOfMonth }
    });

    // Get total suppliers count (active suppliers)
    let totalSuppliers = 0;
    try {
      totalSuppliers = await Supplier.countDocuments({ isActive: true });
    } catch (error) {
      console.error('Error counting suppliers:', error);
      totalSuppliers = 0;
    }

    // Get total customers (unique customer names from bills)
    const customersResult = await Bill.aggregate([
      { $match: billQuery },
      {
        $group: {
          _id: '$customerName'
        }
      },
      {
        $count: 'totalCustomers'
      }
    ]);

    // Get new customers today (first bill today)
    const newCustomersToday = await Bill.aggregate([
      {
        $match: {
          ...billQuery,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$customerName',
          firstBill: { $min: '$createdAt' }
        }
      },
      {
        $match: {
          firstBill: { $gte: today }
        }
      },
      {
        $count: 'newCustomers'
      }
    ]);

    // Get low stock items
    // Check items where stock is less than or equal to minStock
    const allItems = await Item.find(itemQuery)
      .select('name sku stock minStock batches')
      .lean();

    const lowStockItems = allItems
      .filter(item => {
        // Calculate stock from batches if available, otherwise use stock field
        const currentStock = item.batches && item.batches.length > 0
          ? item.batches
              .filter(batch => batch.isActive)
              .reduce((sum, batch) => sum + (batch.quantity || 0), 0)
          : (item.stock || 0);
        
        const threshold = item.minStock || 0;
        return currentStock <= threshold && threshold > 0;
      })
      .map(item => {
        const currentStock = item.batches && item.batches.length > 0
          ? item.batches
              .filter(batch => batch.isActive)
              .reduce((sum, batch) => sum + (batch.quantity || 0), 0)
          : (item.stock || 0);
        
        return {
          name: item.name,
          sku: item.sku,
          quantity: currentStock,
          threshold: item.minStock || 0
        };
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    // Calculate trends
    const totalSales = totalSalesResult[0]?.totalSales || 0;
    const lastWeekSales = lastWeekSalesResult[0]?.totalSales || 0;
    const todaySales = todaySalesResult[0]?.totalSales || 0;
    const yesterdaySales = yesterdaySalesResult[0]?.totalSales || 0;
    const totalCustomers = customersResult[0]?.totalCustomers || 0;
    const newCustomersCount = newCustomersToday[0]?.newCustomers || 0;

    // Calculate percentage changes
    const salesTrend = lastWeekSales > 0 
      ? ((totalSales - lastWeekSales) / lastWeekSales) * 100 
      : 0;
    const dailyTrend = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        metrics: {
          totalSales: totalSales || 0,
          totalItems: totalItems || 0,
          dailyRevenue: todaySales || 0,
          totalCustomers: totalCustomers || 0,
          totalSuppliers: totalSuppliers || 0,
          todayBills: todaySalesResult[0]?.totalBills || 0
        },
        trends: {
          salesTrend: salesTrend.toFixed(1),
          dailyTrend: dailyTrend.toFixed(1),
          itemsAddedThisMonth,
          newCustomersToday: newCustomersCount
        },
        charts: {
          weeklySales: weeklySalesData,
          categorySales: categoryData.length > 0 ? categoryData : [
            { name: 'All Sales', value: totalSales }
          ]
        },
        lowStockItems: lowStockItems
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


import { query } from '../db/index.js';
import { getUserById } from '../repositories/userRepository.js';

const getSelectedStoreId = async (user) => {
    if (user?.selectedStore?.id) {
        return user.selectedStore.id;
    }
    const freshUser = await getUserById(user._id);
    return freshUser?.selectedStore?.id || null;
};

const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

export const getDashboardStats = async (req, res) => {
    try {
        const storeId = await getSelectedStoreId(req.user);
        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Please select a store before viewing the dashboard.'
            });
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        let salesTotals = { totalSales: 0, totalBills: 0 };
        let todaySales = { totalSales: 0, totalBills: 0 };
        let yesterdaySales = { totalSales: 0 };
        let lastWeekSales = { totalSales: 0 };
        let weeklySales = [];
        let totalCustomers = { totalCustomers: 0 };
        let newCustomersToday = { newCustomers: 0 };
        let lowStockItems = [];
        let totalItems = { totalItems: 0 };
        let itemsAddedThisMonth = { itemsAdded: 0 };
        let totalSuppliers = { totalSuppliers: 0 };

        try {
            [salesTotals] = await query(
                `SELECT 
           COALESCE(SUM(total), 0) AS totalSales,
           COUNT(*) AS totalBills
         FROM bills
         WHERE store_id = ?`,
                [storeId]
            );

            [todaySales] = await query(
                `SELECT COALESCE(SUM(total), 0) AS totalSales, COUNT(*) AS totalBills
         FROM bills
         WHERE store_id = ? AND date >= ?`,
                [storeId, formatDateTime(startOfDay)]
            );

            [yesterdaySales] = await query(
                `SELECT COALESCE(SUM(total), 0) AS totalSales
         FROM bills
         WHERE store_id = ? AND date >= ? AND date < ?`,
                [storeId, formatDateTime(startOfYesterday), formatDateTime(startOfDay)]
            );

            [lastWeekSales] = await query(
                `SELECT COALESCE(SUM(total), 0) AS totalSales
         FROM bills
         WHERE store_id = ? AND date >= ? AND date < ?`,
                [storeId, formatDateTime(startOfWeek), formatDateTime(startOfDay)]
            );

            weeklySales = await query(
                `SELECT DATE(date) AS saleDate, COALESCE(SUM(total), 0) AS totalSales
         FROM bills
         WHERE store_id = ? AND date >= ?
         GROUP BY DATE(date)
         ORDER BY saleDate ASC`,
                [storeId, formatDateTime(startOfWeek)]
            );

            [totalCustomers] = await query(
                `SELECT COUNT(DISTINCT customer_name) AS totalCustomers
         FROM bills
         WHERE store_id = ? AND customer_name IS NOT NULL AND customer_name <> ''`,
                [storeId]
            );

            [newCustomersToday] = await query(
                `SELECT COUNT(*) AS newCustomers
         FROM (
           SELECT customer_name, MIN(date) AS first_purchase
           FROM bills
           WHERE store_id = ? AND customer_name IS NOT NULL AND customer_name <> ''
           GROUP BY customer_name
         ) AS customer_first_purchase
         WHERE first_purchase >= ?`,
                [storeId, formatDateTime(startOfDay)]
            );
        } catch (error) {
            console.warn('Dashboard sales queries skipped:', error?.message || error);
        }

        try {
            lowStockItems = await query(
                `SELECT i.id, i.name, i.item_code AS itemCode, inv.qty_on_hand AS quantity, i.reorder_level AS threshold
         FROM items i
         INNER JOIN inventories inv ON inv.item_id = i.id
         WHERE inv.store_id = ? AND inv.qty_on_hand <= i.reorder_level AND i.reorder_level > 0
         ORDER BY inv.qty_on_hand ASC
         LIMIT 10`,
                [storeId]
            );
        } catch (error) {
            console.warn('Dashboard low stock query skipped:', error?.message || error);
        }

        try {
            [totalItems] = await query(
                `SELECT COUNT(*) AS totalItems FROM items WHERE is_active = 1`
            );

            [itemsAddedThisMonth] = await query(
                `SELECT COUNT(*) AS itemsAdded
         FROM items
         WHERE is_active = 1 AND created_at >= ?`,
                [formatDateTime(startOfMonth)]
            );

            [totalSuppliers] = await query(
                `SELECT COUNT(*) AS totalSuppliers FROM suppliers WHERE is_active = 1`
            );
        } catch (error) {
            console.warn('Dashboard reference data queries skipped:', error?.message || error);
        }

        const todaySalesValue = Number(todaySales?.totalSales || 0);
        const yesterdaySalesValue = Number(yesterdaySales?.totalSales || 0);
        const lastWeekSalesValue = Number(lastWeekSales?.totalSales || 0);
        const totalSalesValue = Number(salesTotals?.totalSales || 0);

        const salesTrend = lastWeekSalesValue > 0
            ? (((totalSalesValue - lastWeekSalesValue) / lastWeekSalesValue) * 100)
            : 0;
        const dailyTrend = yesterdaySalesValue > 0
            ? (((todaySalesValue - yesterdaySalesValue) / yesterdaySalesValue) * 100)
            : 0;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(startOfDay);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().slice(0, 10);
            const record = weeklySales.find((row) => {
                if (row?.saleDate instanceof Date) {
                    return row.saleDate.toISOString().slice(0, 10) === dateStr;
                }
                return row?.saleDate === dateStr;
            });
            chartData.push({
                name: dayNames[date.getDay()],
                sales: Number(record?.totalSales || 0)
            });
        }

        res.json({
            success: true,
            data: {
                metrics: {
                    totalSales: totalSalesValue,
                    totalItems: Number(totalItems?.totalItems || 0),
                    dailyRevenue: todaySalesValue,
                    totalCustomers: Number(totalCustomers?.totalCustomers || 0),
                    totalSuppliers: Number(totalSuppliers?.totalSuppliers || 0),
                    todayBills: Number(todaySales?.totalBills || 0)
                },
                trends: {
                    salesTrend: Number.isFinite(salesTrend) ? Number(salesTrend.toFixed(1)) : 0,
                    dailyTrend: Number.isFinite(dailyTrend) ? Number(dailyTrend.toFixed(1)) : 0,
                    itemsAddedThisMonth: Number(itemsAddedThisMonth?.itemsAdded || 0),
                    newCustomersToday: Number(newCustomersToday?.newCustomers || 0)
                },
                charts: {
                    weeklySales: chartData,
                    categorySales: [
                        { name: 'All Sales', value: totalSalesValue }
                    ]
                },
                lowStockItems: lowStockItems.map((item) => ({
                    name: item.name,
                    sku: item.itemCode,
                    quantity: Number(item.quantity || 0),
                    threshold: Number(item.threshold || 0)
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


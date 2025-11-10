import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Supplier from '../models/Supplier.js';

const SUPPLIER_FIELDS = [
    'Suppliername',
    'Abbreviation',
    'Creationdate',
    'Address1',
    'Address2',
    'Address3',
    'Citycode',
    'State',
    'Pincode',
    'Tngstnumber',
    'Phone',
    'Fax',
    'Email',
    'Tradediscount',
    'Creditdays',
    'Paymentofweek',
    'Suppliertype',
    'Discountoption',
    'OverallDiscountOption',
    'Paymentmode',
    'Productdiscount',
    'Accounttype',
    'Leadtime',
    'Orderschedule',
    'Deliveryschedule',
    'Cstnumber',
    'Dlnumber',
    'Contactperson1',
    'CP1Address1',
    'CP1Address2',
    'CP1Address3',
    'CP1Citycode',
    'CP1State',
    'CP1Pincode',
    'CP1Designation',
    'CP1Phone',
    'CP1MobileNo',
    'CP1Fax',
    'CP1Email',
    'Contactperson2',
    'CP2Address1',
    'CP2Address2',
    'CP2Address3',
    'CP2Citycode',
    'CP2State',
    'CP2Pincode',
    'CP2Designation',
    'CP2Phone',
    'CP2MobileNo',
    'CP2Fax',
    'CP2Email',
    'Placeorder',
    'Producttype',
    'Type',
    'Creditterms',
    'Remarks',
    'Tinnumber',
    'Vatdealertype',
    'Universalsuppliercode',
    'Reworkpurchaseprice',
    'Purchasereturnmode',
    'Purchasereturnpercentage',
    'Calculatetaxforfree',
    'Suppliertoleranceinpercentage',
    'OrdCitycode',
    'Inceptiondate',
    'Transportationmode',
    'Suppliercategorycode',
    'Mobilenumber',
    'StockToSaleRatio',
    'ExpOrDamageSettlement',
    'ModifiedDate',
    'CreatedbyUser',
    'ModifiedbyUser',
    'Importeddate',
    'IsImported',
    'FileName',
    'GrnHeaderInfo',
    'GrnHeaderColWidth',
    'GrnHeaderLockedCol',
    'isActive',
    'ReturnAdjustmentMode',
    'ProdDiscAffectsCost',
    'OverallDiscAffectsCost',
    'MarginBasedOn',
    'FreeAffectCost',
    'ExpiryDamageRateMode',
    'ExpiryDamageLessPercentage',
    'OldCode',
    'PurchaseLocation',
    'PrintFormat',
    'SupplierOrderLevel',
    'SupplierOrderRatio',
    'FreeAffectMargin',
    'DlNumber1',
    'IssueSeriesName',
    'LastIssueNo',
    'MrpToleranceAmt',
    'MrpNegativeToleranceAmt',
    'MasterId',
    'PurchasePriceInclExiseDuty',
    'OverallDiscountAffectsMargin',
    'CSTAffectCost',
    'CSTAffectMargin',
    'CSTComputation',
    'ProductDiscountAffectsMargin',
    'ContactPerson1PhoneNo',
    'ContactPerson2PhoneNo',
    'SupplierReturnRemainderFromDate',
    'SupplierReturnRemainderToDate',
    'AccountsPaymentMode',
    'POLoadingOrder',
    'Areacode',
    'AutoMatch',
    'MarkUp',
    'MarkDown',
    'MarkUpRate1',
    'MarkDownRate1',
    'MarkUpRate2',
    'MarkDownRate2',
    'AdditionalCostAffectItemCost',
    'printDo',
    'CCMailId',
    'AllowSMS',
    'LBTApplicable',
    'ExciseDutyCode',
    'AIOCDSupplierCode',
    'BuyerID',
    'PaymentAt',
    'AllowedMailTrans',
    'CurrencyCode',
    'POApprovalRequired',
    'PANNumber',
    'SalesRepMobileNo',
    'DealerType',
    'GSTNumber',
    'TANNumber',
    'UniqueIdentificationNumber',
    'WebOrderEnabled',
    'SupplierUIDNumber',
    'ValidSeries',
    'TransportCode',
    'Distance',
    'SyncId',
    'OpBalEntryDate',
    'DueDateasChequeDate',
    'CreatedAtStoreCode',
    'DueDateCalculation',
    'AutoPOMail',
    'POTerms',
    'EnableforTCS',
    'LoadBottleItem',
    'ConsiderFreeForExpiry',
    'IsGSTINVerified',
    'GSTINVerifiedOn',
    'GSTINStatus',
    'EnableforTDS'
];

const respondValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
        return true;
    }
    return false;
};

const buildPayload = (body) => {
    const payload = {};
    SUPPLIER_FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            payload[field] = body[field];
        }
    });
    if (Object.prototype.hasOwnProperty.call(body, 'Suppliername')) {
        payload.Suppliername = body.Suppliername;
    }
    return payload;
};

export const listSuppliers = async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { Suppliername: { [Op.like]: `%${search}%` } },
                { Email: { [Op.like]: `%${search}%` } },
                { Phone: { [Op.like]: `%${search}%` } }
            ];
        }

        const suppliers = await Supplier.findAll({
            where,
            order: [['Suppliercode', 'ASC']]
        });

        res.json({
            status: 'success',
            data: suppliers
        });
    } catch (error) {
        console.error('Error listing suppliers:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while fetching suppliers'
        });
    }
};

export const getSupplierByCode = async (req, res) => {
    try {
        const supplierCode = Number(req.params.supplierCode);
        const supplier = await Supplier.findByPk(supplierCode);

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        res.json({
            status: 'success',
            data: supplier
        });
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while fetching supplier'
        });
    }
};

export const createSupplier = async (req, res) => {
    if (respondValidationErrors(req, res)) return;

    try {
        const payload = buildPayload(req.body);
        payload.Suppliername = req.body.Suppliername.trim();

        const supplier = await Supplier.create(payload);

        res.status(201).json({
            status: 'success',
            message: 'Supplier created successfully',
            data: supplier
        });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while creating supplier'
        });
    }
};

export const updateSupplier = async (req, res) => {
    if (respondValidationErrors(req, res)) return;

    try {
        const supplierCode = Number(req.params.supplierCode);
        const supplier = await Supplier.findByPk(supplierCode);

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        const payload = buildPayload(req.body);

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No valid fields supplied for update'
            });
        }

        await supplier.update(payload);

        res.json({
            status: 'success',
            message: 'Supplier updated successfully',
            data: supplier
        });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while updating supplier'
        });
    }
};

export const deleteSupplier = async (req, res) => {
    try {
        const supplierCode = Number(req.params.supplierCode);
        const supplier = await Supplier.findByPk(supplierCode);

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        await supplier.destroy();

        res.json({
            status: 'success',
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error while deleting supplier'
        });
    }
};

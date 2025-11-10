import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Supplier = sequelize.define(
    'Supplier',
    {
        Suppliercode: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'Suppliercode'
        },
        Suppliername: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'Suppliername'
        },
        Abbreviation: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Abbreviation'
        },
        Creationdate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Creationdate'
        },
        Address1: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Address1'
        },
        Address2: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Address2'
        },
        Address3: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Address3'
        },
        Citycode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Citycode'
        },
        State: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'State'
        },
        Pincode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Pincode'
        },
        Tngstnumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Tngstnumber'
        },
        Phone: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'Phone'
        },
        Fax: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Fax'
        },
        Email: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Email'
        },
        Tradediscount: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Tradediscount'
        },
        Creditdays: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Creditdays'
        },
        Paymentofweek: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Paymentofweek'
        },
        Suppliertype: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Suppliertype'
        },
        Discountoption: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Discountoption'
        },
        OverallDiscountOption: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'OverallDiscountOption'
        },
        Paymentmode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Paymentmode'
        },
        Productdiscount: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Productdiscount'
        },
        Accounttype: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Accounttype'
        },
        Leadtime: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Leadtime'
        },
        Orderschedule: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Orderschedule'
        },
        Deliveryschedule: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Deliveryschedule'
        },
        Cstnumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Cstnumber'
        },
        Dlnumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Dlnumber'
        },
        Contactperson1: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Contactperson1'
        },
        CP1Address1: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Address1'
        },
        CP1Address2: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Address2'
        },
        CP1Address3: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Address3'
        },
        CP1Citycode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Citycode'
        },
        CP1State: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1State'
        },
        CP1Pincode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Pincode'
        },
        CP1Designation: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Designation'
        },
        CP1Phone: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Phone'
        },
        CP1MobileNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1MobileNo'
        },
        CP1Fax: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Fax'
        },
        CP1Email: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP1Email'
        },
        Contactperson2: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Contactperson2'
        },
        CP2Address1: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Address1'
        },
        CP2Address2: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Address2'
        },
        CP2Address3: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Address3'
        },
        CP2Citycode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Citycode'
        },
        CP2State: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2State'
        },
        CP2Pincode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Pincode'
        },
        CP2Designation: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Designation'
        },
        CP2Phone: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Phone'
        },
        CP2MobileNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2MobileNo'
        },
        CP2Fax: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Fax'
        },
        CP2Email: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CP2Email'
        },
        Placeorder: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Placeorder'
        },
        Producttype: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Producttype'
        },
        Type: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Type'
        },
        Creditterms: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Creditterms'
        },
        Remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Remarks'
        },
        Tinnumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Tinnumber'
        },
        Vatdealertype: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Vatdealertype'
        },
        Universalsuppliercode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Universalsuppliercode'
        },
        Reworkpurchaseprice: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Reworkpurchaseprice'
        },
        Purchasereturnmode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Purchasereturnmode'
        },
        Purchasereturnpercentage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Purchasereturnpercentage'
        },
        Calculatetaxforfree: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Calculatetaxforfree'
        },
        Suppliertoleranceinpercentage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Suppliertoleranceinpercentage'
        },
        OrdCitycode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'OrdCitycode'
        },
        Inceptiondate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Inceptiondate'
        },
        Transportationmode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Transportationmode'
        },
        Suppliercategorycode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Suppliercategorycode'
        },
        Mobilenumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Mobilenumber'
        },
        StockToSaleRatio: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'StockToSaleRatio'
        },
        ExpOrDamageSettlement: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ExpOrDamageSettlement'
        },
        ModifiedDate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ModifiedDate'
        },
        CreatedbyUser: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CreatedbyUser'
        },
        ModifiedbyUser: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ModifiedbyUser'
        },
        Importeddate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Importeddate'
        },
        IsImported: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'IsImported'
        },
        FileName: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'FileName'
        },
        GrnHeaderInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GrnHeaderInfo'
        },
        GrnHeaderColWidth: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GrnHeaderColWidth'
        },
        GrnHeaderLockedCol: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GrnHeaderLockedCol'
        },
        isActive: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'isActive'
        },
        ReturnAdjustmentMode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ReturnAdjustmentMode'
        },
        ProdDiscAffectsCost: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ProdDiscAffectsCost'
        },
        OverallDiscAffectsCost: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'OverallDiscAffectsCost'
        },
        MarginBasedOn: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarginBasedOn'
        },
        FreeAffectCost: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'FreeAffectCost'
        },
        ExpiryDamageRateMode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ExpiryDamageRateMode'
        },
        ExpiryDamageLessPercentage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ExpiryDamageLessPercentage'
        },
        OldCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'OldCode'
        },
        PurchaseLocation: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'PurchaseLocation'
        },
        PrintFormat: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'PrintFormat'
        },
        SupplierOrderLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'SupplierOrderLevel'
        },
        SupplierOrderRatio: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SupplierOrderRatio'
        },
        FreeAffectMargin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'FreeAffectMargin'
        },
        DlNumber1: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'DlNumber1'
        },
        IssueSeriesName: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'IssueSeriesName'
        },
        LastIssueNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'LastIssueNo'
        },
        MrpToleranceAmt: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MrpToleranceAmt'
        },
        MrpNegativeToleranceAmt: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MrpNegativeToleranceAmt'
        },
        MasterId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MasterId'
        },
        PurchasePriceInclExiseDuty: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'PurchasePriceInclExiseDuty'
        },
        OverallDiscountAffectsMargin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'OverallDiscountAffectsMargin'
        },
        CSTAffectCost: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'CSTAffectCost'
        },
        CSTAffectMargin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'CSTAffectMargin'
        },
        CSTComputation: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'CSTComputation'
        },
        ProductDiscountAffectsMargin: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ProductDiscountAffectsMargin'
        },
        ContactPerson1PhoneNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ContactPerson1PhoneNo'
        },
        ContactPerson2PhoneNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ContactPerson2PhoneNo'
        },
        SupplierReturnRemainderFromDate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SupplierReturnRemainderFromDate'
        },
        SupplierReturnRemainderToDate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SupplierReturnRemainderToDate'
        },
        AccountsPaymentMode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'AccountsPaymentMode'
        },
        POLoadingOrder: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'POLoadingOrder'
        },
        Areacode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'Areacode'
        },
        AutoMatch: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'AutoMatch'
        },
        MarkUp: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkUp'
        },
        MarkDown: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkDown'
        },
        MarkUpRate1: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkUpRate1'
        },
        MarkDownRate1: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkDownRate1'
        },
        MarkUpRate2: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkUpRate2'
        },
        MarkDownRate2: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MarkDownRate2'
        },
        AdditionalCostAffectItemCost: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'AdditionalCostAffectItemCost'
        },
        printDo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'printDo'
        },
        CCMailId: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CCMailId'
        },
        AllowSMS: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'AllowSMS'
        },
        LBTApplicable: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'LBTApplicable'
        },
        ExciseDutyCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ExciseDutyCode'
        },
        AIOCDSupplierCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'AIOCDSupplierCode'
        },
        BuyerID: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'BuyerID'
        },
        PaymentAt: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'PaymentAt'
        },
        AllowedMailTrans: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'AllowedMailTrans'
        },
        CurrencyCode: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'CurrencyCode'
        },
        POApprovalRequired: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'POApprovalRequired'
        },
        PANNumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'PANNumber'
        },
        SalesRepMobileNo: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SalesRepMobileNo'
        },
        DealerType: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'DealerType'
        },
        GSTNumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GSTNumber'
        },
        TANNumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'TANNumber'
        },
        UniqueIdentificationNumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'UniqueIdentificationNumber'
        },
        WebOrderEnabled: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'WebOrderEnabled'
        },
        SupplierUIDNumber: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SupplierUIDNumber'
        },
        ValidSeries: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ValidSeries'
        },
        TransportCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'TransportCode'
        },
        Distance: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Distance'
        },
        SyncId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'SyncId'
        },
        OpBalEntryDate: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'OpBalEntryDate'
        },
        DueDateasChequeDate: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'DueDateasChequeDate'
        },
        CreatedAtStoreCode: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CreatedAtStoreCode'
        },
        DueDateCalculation: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'DueDateCalculation'
        },
        AutoPOMail: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'AutoPOMail'
        },
        POTerms: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'POTerms'
        },
        EnableforTCS: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'EnableforTCS'
        },
        LoadBottleItem: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'LoadBottleItem'
        },
        ConsiderFreeForExpiry: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ConsiderFreeForExpiry'
        },
        IsGSTINVerified: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'IsGSTINVerified'
        },
        GSTINVerifiedOn: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GSTINVerifiedOn'
        },
        GSTINStatus: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'GSTINStatus'
        },
        EnableforTDS: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'EnableforTDS'
        }
    },
    {
        tableName: 'Suppliers',
        timestamps: false
    }
);

export default Supplier;
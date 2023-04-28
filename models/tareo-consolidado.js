var db = require('../dbconnection')
const { poolPromise, sql } = require('../dbconnectionMSSQL')
var fs = require('fs')
var Excel = require('exceljs')
const moment = require('moment')
const usuario = require("./usuario")
var workbook = new Excel.Workbook()
const tareo = require("./tareo")

class TareoConsolidado {
    async types() {
        let sql = 'select tipo_planilla from tareo_detalle_json group by tipo_planilla';
        return await db.query(sql);

    }
    async findUsers(type) {
        const pool = await poolPromise;

        const result = await pool.request()
            .query(`EXEC GetEmployeeByPayroll_v2 '${type.trim()}',''`)
        let employees = result.recordset;
        return {
            rows: employees,
            success: true,
            message: "Extracción de usuarios exitoso."
        };
    }
    async find({ Mes, Anio, type, diasEnUnMes }) {
        try {
            const empleadosP = (await this.findUsers(type)).rows;
            return await tareo.getiClockTransactionsRefactor({ Mes, Anio, diasEnUnMes, empleadosP })
            
        } catch (error) {
            console.log('error :>> ', error);
            throw error;
        }
    }
    dynamicSortMultiple() {
        const tareoFile = this;
        var props = arguments;
        return function (obj1, obj2) {
            var i = 0, result = 0, numberOfProperties = props.length;
            while (result === 0 && i < numberOfProperties) {
                result = tareoFile.dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result;
        }
    }
    dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
}

module.exports = new TareoConsolidado();
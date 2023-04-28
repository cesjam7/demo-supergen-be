let db = require('../dbconnection')
const mysql = require("../dbconnectionPromise")
//sdwd
const { poolPromise, sql } = require('../dbconnectionMSSQL')
let fs = require('fs')
let Excel = require('exceljs')
const moment = require('moment')
const usuario = require("./usuario")
let workbook = new Excel.Workbook()
let sendEmailModel = require('./sendEmail');
const tipoDocumentoModelo = {

    listar: async function () {
        const connection = await mysql.connection();
        try {

            const documentos = await connection.query("select * from contab_tdoc")
            return documentos
        } catch (err) {
            throw error;
        } finally {
            connection.release();
        }


    },

    grabar: async function (tipoDocumento) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into contab_tdoc(id,tipo,validaSunat,transferir,abreviatura)values(?,?,?,?,?)", [tipoDocumento.id, tipoDocumento.tipo, tipoDocumento.validaSunat, tipoDocumento.transferir, tipoDocumento.abreviatura]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }



    },
    editar: async function (tipoDocumento) {


        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update contab_tdoc set tipo=?,validaSunat=?,transferir=?,abreviatura = ? where id=?", [tipoDocumento.tipo, tipoDocumento.validaSunat, tipoDocumento.transferir, tipoDocumento.abreviatura,tipoDocumento.id ]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    eliminar: async function (tipoDocumento) { }

}

module.exports = tipoDocumentoModelo

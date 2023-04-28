var db = require('../dbconnection');
var { poolPromise } = require('../dbconnectionMSSQL')
const { json } = require('body-parser');
const mysql = require("../dbconnectionPromise");
const moment = require('moment');

const usuarioModelo = require('./usuario')
const prodLog = {
    save: async function (prodLog, usuarioId) {

        const prodLogArray = Array.isArray(prodLog) ? prodLog : [prodLog];
        const connection = await mysql.connection();
        const usuarioBd = await usuarioModelo.getusuarioByIdPromise(usuarioId)
        try {
            if (usuarioBd.length == 0) {
                throw new Error("Usuario no encontrado")
            }
            const prodLogValues = prodLogArray.map(p => ([p.proceso, p.idObjeto, p.tipo, JSON.stringify(p.data), usuarioBd[0].email]))
            await connection.query("START TRANSACTION");
            await connection.query("insert into prod_log(proceso,idObjeto,tipo,data,usuario) values ?", [prodLogValues]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    list: async function () {

        const connection = await mysql.connection();
        try {
            const prodLogs = await connection.query("select * from prod_log");
            return prodLogs;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }



};

module.exports = prodLog;

const mysql = require("../dbconnectionPromise")
const db = require('../dbconnection');

const proyFactor = {
    guardar: async function (factor, usuarioId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const listaFactores = await this.listar();

            if (listaFactores.length > 0) {
                throw new Error("Ya existe un registro de factores")
            }
            await connection.query("insert into proy_factormort(factormort_lev_FE,factormort_prod_lh_FE,factormort_prod_lm_FE,factorcastigo,fec_reg,factor_bbs_FE,usuario_reg,factor_venta_macho_FE,factormort_lev,factormort_prod_lh,factormort_prod_lm,factor_bbs,factor_venta_macho) values(?,?,?,?,?,?,?,?,?,?,?,?)",
                [factor.factormort_lev,
                factor.factormort_prod_lh_FE, factor.factormort_prod_lm_FE, factor.factorcastigo, new Date(), factor.factor_bbs_FE, usuarioId, factor.factor_venta_macho_FE, factor.factormort_lev / 100, factor.factormort_prod_lh_FE, factor.factormort_prod_lm, factor.factor_bbs_FE / 100, factor.factor_venta_macho_FE / 100]);
            await connection.query("COMMIT");
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listar: async function () {
        try {
            const data = await db.query("select * from proy_factormort order by fec_reg");
            return data;
        } catch (error) {
            throw error;
        }
    },
    editar: async function (factor) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update proy_factormort set factormort_lev_FE=?,factormort_prod_lh_FE=?,factormort_prod_lm_FE=?,factorcastigo=?,factor_bbs_FE=?,factor_venta_macho_FE=?,factormort_lev=?,factormort_prod_lh=?,factormort_prod_lm=?,factor_bbs=?,factor_venta_macho=? where id=?",
                [factor.factormort_lev_FE, factor.factormort_prod_lh_FE, factor.factormort_prod_lm_FE, factor.factorcastigo, factor.factor_bbs_FE, factor.factor_venta_macho_FE, factor.factormort_lev_FE / 100, factor.factormort_prod_lh_FE/100, factor.factormort_prod_lm_FE/100,factor.factor_bbs_FE / 100, factor.factor_venta_macho_FE / 100, factor.id]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    }
}
module.exports = proyFactor;
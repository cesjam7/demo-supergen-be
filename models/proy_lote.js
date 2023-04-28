const moment = require("moment");
const mysql = require("../dbconnectionPromise")

const proyLoteModel = {
    actualizacionGenerica: async function (props = {}, loteId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update  proy_lote set " + Object.keys(props).map(key => key + "=? ").join(",") + " where idLote=? ", [...Object.values(props), loteId]);
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }
    },
    getProyLoteByProyIngresoLote: async function (selectedFields = [], ingresoLoteId, filterCondition = () => true) {
        const connection = await mysql.connection();
        try {

            const data = await connection.query("select " + selectedFields.join() + " from  proy_lote where idProyIngresoLote=? ", [ingresoLoteId]);
            return data.filter(data => filterCondition(data))

        } catch (error) {

            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = proyLoteModel;
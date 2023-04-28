const moment = require("moment");
const mysql = require("../dbconnectionPromise")

const proyLoteDetalleYProyIngresoLoteModel = {
    actualizacionProyLoteDetalleCamposReal: async function (proyLoteDetalleConValoresReales = []) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const queryBatch = proyLoteDetalleConValoresReales.map(proy => `update proy_loteDetalle set porcentajeNacimientoReal=${proy.porcentajeNacimientoReal}, porcentajeHiReal=${proy.porcentajeHiReal},porcentajePosturaReal=${proy.porcentajePosturaReal},saldoBbsReal=${proy.saldoBbsReal},saldoHiReal=${proy.saldoHiReal},saldoAvesReal=${proy.saldoAvesReal} where id=${proy.id}`)
            await connection.query(queryBatch.join(";"));
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },
    listarProyLoteDetallPorIngresoLoteId: async function (ingresoLoteId) {
        const connection = await mysql.connection();
        try {

            const listaProyIngresoLote = await connection.query("select loteDetalle.*,lote.idLinea,lote.lote,lote.loteStr,lote.tipoGenero,lote.sexo from proy_loteDetalle loteDetalle inner join proy_lote lote on lote.idLote=loteDetalle.idLote where loteDetalle.idProyIngresoLote=?", [ingresoLoteId]);
            const listaProyLoteDetalleH = listaProyIngresoLote.filter((loteDetalle) => loteDetalle.tipoGenero == "LH")
            const listaProyLoteDetalleM = listaProyIngresoLote.filter((loteDetalle) => loteDetalle.tipoGenero == "LM")
            const listaUnida = []
            for (let index = 0; index < listaProyLoteDetalleM.length; index++) {
                const loteH = listaProyLoteDetalleH[index]
                const loteM = listaProyLoteDetalleM[index]
                listaUnida.push({
                    fechaMovimiento: moment(loteH.fechaMovimiento).format("YYYY-MM-DD"),
                    tipo: loteH.tipo,
                    semana: loteH.semana,
                    lineaHembra: {
                        saldoAves: loteH.saldoAves, saldoHi: loteH.saldoHi, saldoBbs: loteH.saldoBbs,
                        porcentajePostura: loteH.porcentajePostura,
                        porcentajeHi: loteH.porcentajeHi,
                        porcentajeNacimiento: loteH.porcentajeNacimiento,
                        porcentajeHiReal: loteH.porcentajeHiReal,
                        porcentajePosturaReal: loteH.porcentajePosturaReal,
                        saldoBbsReal: loteH.saldoBbsReal,
                        saldoHiReal: loteH.saldoHiReal,
                        saldoAvesReal: loteH.saldoAvesReal,
                        porcentajeNacimientoReal: loteH.porcentajeNacimientoReal
                    },
                    lineaMacho: {
                        saldoAves: loteM.saldoAves, saldoHi: loteM.saldoHi,
                        saldoBbs: loteM.saldoBbs,
                        porcentajePostura: loteM.porcentajePostura,
                        porcentajeHi: loteM.porcentajeHi,
                        porcentajeNacimiento: loteM.porcentajeNacimiento,
                        porcentajeHiReal: loteM.porcentajeHiReal,
                        porcentajePosturaReal: loteM.porcentajePosturaReal,
                        saldoBbsReal: loteM.saldoBbsReal,
                        saldoHiReal: loteM.saldoHiReal,
                        saldoAvesReal: loteM.saldoAvesReal,
                        porcentajeNacimientoReal: loteM.porcentajeNacimientoReal
                    }
                })


            }
            return listaUnida;
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },
}

module.exports = proyLoteDetalleYProyIngresoLoteModel;
const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const factorMortalidadModel = require("./proyFactores");

const proyPedidoVentaDetalleModel = {
    crearBatch: async function (pedidoVentaDetalle = [], pedidoVentaId, usuarioRegistroId) {
        const connection = await mysql.connection();
        try {
            let factorMortalidad = await factorMortalidadModel.listar();

            if (factorMortalidad.length == 0) {
                throw new Error("No hay un factor registrado")
            }
            factorMortalidad = factorMortalidad[0];
            await connection.query("START TRANSACTION");
            const pedidoVentaDetalleValue = pedidoVentaDetalle.map(pedidoVenta => [
                pedidoVenta.id, pedidoVentaId, pedidoVenta.fechaPedido, pedidoVenta.cantidadHembras, pedidoVenta.cantidadHembras * factorMortalidad.factor_venta_macho, new Date(), usuarioRegistroId])
            await connection.query("insert into proy_pedido_venta_detalle(id,idPedidoVenta,fechaPedido,cantidadHembras,cantidadMachos,fechaRegistro,usuarioRegistro) VALUES ?", [pedidoVentaDetalleValue]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },

    editar: async function ({ cantidadHembras, cantidadMachos, fechaPedido, id }) {
        const connection = await mysql.connection();
        try {
            return await connection.query(`update proy_pedido_venta_detalle set fechaPedido='${moment(fechaPedido).format('YYYY-MM-DD')}', cantidadHembras=${cantidadHembras},cantidadMachos=${cantidadMachos} where id='${id}'`);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    agregarDetalle: async function ({ cantidadHembras, cantidadMachos, fechaPedido, id }, pedidoVentaId, idUsuarioRegistro) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query(`insert into proy_pedido_venta_detalle(id,idPedidoVenta,fechaPedido,cantidadHembras,cantidadMachos,fechaRegistro,usuarioRegistro) VALUES ('${id}', '${pedidoVentaId}', '${fechaPedido}', ${cantidadHembras}, ${cantidadMachos}, '${moment().format('YYYY-MM-DD')}',${idUsuarioRegistro})`);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },

    eliminarDetalle: async function (idPedidoVentaDetalle) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query(`delete from proy_pedido_venta_detalle where id='${idPedidoVentaDetalle}'`);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listarPorPedidoVentaId: async function (pedidoVentaId) {
        const connection = await mysql.connection();
        try {

            return await connection.query("select DATE_FORMAT(pd.fechaPedido,'%Y-%m-%d') as fechaPedido,pd.cantidadHembras ,pd.cantidadMachos,pd.id from proy_pedido_venta_detalle pd where idPedidoVenta=? and estado<>0 order by pd.fechaPedido desc", [pedidoVentaId]);
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }



}

module.exports = proyPedidoVentaDetalleModel;
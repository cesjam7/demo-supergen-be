const mysql = require("../dbconnectionPromise")
const proyAccionesModel = {

    guardar: async function (accionConMenu) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into proy_acciones(Accion,codigo,idMenu) values(?,?,?)", [accionConMenu.Accion, accionConMenu.codigo, accionConMenu.menu.idMenu]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    editar: async function (accionConMenu) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update  proy_acciones set Accion=?,codigo=?,idMenu=? where idAcciones=?", [accionConMenu.Accion, accionConMenu.codigo, accionConMenu.menu.idMenu, accionConMenu.idAcciones]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listarAccionMenu: async function () {
        
        const connection = await mysql.connection();
        try {
            const accionesRow = await connection.query("select * from proy_acciones accion inner join proy_menu menu on menu.idMenu=accion.idMenu where accion.estado<> 0");
            return accionesRow.map((accion) => ({ menu: { idMenu: accion.idMenu, Menu: accion.Menu }, idAcciones: accion.idAcciones, Accion: accion.Accion, codigo: accion.codigo }))
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    eliminarAccion: async function (accionId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update proy_acciones set estado=0 where idAcciones=?", [accionId]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    }


}

module.exports = proyAccionesModel
const mysql = require("../dbconnectionPromise")
const proyRolModel = {
    guardarRol: async function (rolConAcciones) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const rolSaved = await connection.query("insert into proy_roles(Rol) values(?)", [rolConAcciones.Rol]);
            const accionPorRolMap = rolConAcciones.acciones.map(accion => [rolSaved.insertId, accion.idAcciones])
            await connection.query("insert into proy_accionxrol(idRol,idAccion) values ?", [accionPorRolMap])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    actualizarRol: async function (rolConAcciones) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update   proy_roles set Rol=? where idRol=? ", [rolConAcciones.Rol, rolConAcciones.idRol]);
            await connection.query("delete  from proy_accionxrol where idRol=? ", [rolConAcciones.idRol])
            const accionPorRolMap = rolConAcciones.acciones.map(accion => [rolConAcciones.idRol, accion.idAcciones])
            await connection.query("insert into proy_accionxrol(idRol,idAccion) values ?", [accionPorRolMap])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    eliminaRol: async function (rolId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const numeroUsuariosAsignadosAlRol = await connection.query("select count(idUserRoles) from proy_userroles where idRol=?", [rolId])
            if (numeroUsuariosAsignadosAlRol > 0) {
                throw new Error("El rol ya esta asignado a algun usuario")
            }
            await connection.query("update proy_roles set estado=0 where idRol=?", [rolId]);
            await connection.query("update proy_accionxrol set estado=0 where idRol=?", [rolId]);
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    traerRolConAccionesPorId: async function (rolId) {
        const connection = await mysql.connection();
        try {
            const rol = await connection.query("select * from proy_roles where idRol=?", [rolId])
            console.log("rol", rol)
            const acciones = await connection.query("select accion.* from proy_accionxrol axrol inner join proy_acciones accion  on accion.idAcciones=axrol.idAccion where idRol=? and  axrol.estado<> 0", [rolId])
            return { ...rol[0], acciones: acciones }
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    },
    listar: async function () {
        const connection = await mysql.connection();
        try {
            const roles = await connection.query("select * from proy_roles where estado<> 0")
            return roles;
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }

    }


}
module.exports = proyRolModel;
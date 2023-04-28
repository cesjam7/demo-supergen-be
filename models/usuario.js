var sha1 = require('sha1');
var db = require('../dbconnection');
const mysql = require("../dbconnectionPromise")
const mssqlConcar = require("../dbConnectionMSSQLClass")()
var usuario = {

    getAllusuario: function (callback) {

        return db.query("Select * from usuario u " +
            "INNER JOIN userroles ur ON ur.idUsuario = u.idUsuario " +
            "INNER JOIN roles r ON r.idRol = ur.idRol ", callback);

    },
    getAllUsuarioProy: async function () {
        const connection = await mysql.connection();
        try {
            const usuarios = await connection.query("select * from usuario us inner join proy_userroles  proyUR on us.idUsuario=proyUR.idUsuario inner join proy_roles proyR on proyR.idRol=proyUR.idRol");
            return usuarios.map((usuario) => ({ idUsuario: usuario.idUsuario, Nombre: usuario.Nombre, email: usuario.email, rol: { idRol: usuario.idRol, Rol: usuario.Rol } }))
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    guardarUsuarioProy: async function (usuario) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            const userSave = await connection.query("insert into usuario(Nombre,email,Password,TipoPesaje) values(?,?,?,?)", [usuario.Nombre, usuario.email, sha1(usuario.Password), 0]);
            await connection.query("insert into proy_userroles(idUsuario,idRol) values(?,?)", [userSave.insertId, usuario.rol.idRol])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    editarUsuarioProy: async function (usuario) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update usuario set Nombre=?,email=? where idUsuario=?", [usuario.Nombre, usuario.email, usuario.idUsuario]);
            await connection.query("delete from proy_userroles where idUsuario=?", [usuario.idUsuario])
            await connection.query("insert into proy_userroles(idUsuario,idRol) values(?,?)", [usuario.idUsuario, usuario.rol.idRol])
            await connection.query("COMMIT");
        } catch (error) {
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }

    },
    getFirmaById: function (id) {

        return new Promise((resolve, reject) => {
            return db.query("select firma from usuario where idUsuario=?", [id], (err, results) => {
                if (err) reject(err)
                resolve(results)
            })
        })
    },
    getusuarioById: function (id, callback) {
        return db.query("select * from usuario u LEFT JOIN userroles r ON r.idUsuario = u.idUsuario where u.idUsuario=?", [id], callback);
    },
    getusuarioByIdPromise: function (id) {
        return new Promise((resolve, reject) => {
            db.query("select * from usuario u LEFT JOIN userroles r ON r.idUsuario = u.idUsuario where u.idUsuario=?", [id], (err, result) => {
                if (err) reject(err)
                resolve(result);
            })
        })
    },
    getUltimoUsuario: function (callback) {
        return db.query("select idUsuario, Nombre from usuario ORDER BY idUsuario DESC LIMIT 0,1", callback);
    },
    getPermisosUsuarios: function (id, callback) {
        return db.query("SELECT codigo FROM usuario u LEFT JOIN userroles r ON r.idUsuario = u.idUsuario LEFT JOIN accionxrol a ON a.idRol = r.idRol WHERE u.idUsuario = ?", [id], callback);
    },
    getPermisosUsuarioProyeccion: async (idUsuario) => {
        const connection = await mysql.connection();
        try {
            const permisos = await connection.query("select accion.codigo from proy_accionxrol proyAccionRol inner  JOIN proy_userroles userRoles  on userRoles.idRol=proyAccionRol.idRol inner join proy_acciones accion on accion.idAcciones=proyAccionRol.idAccion where userRoles.idUsuario=?", [idUsuario]);
            return permisos.map(permiso => permiso.codigo)
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    },
    addusuario: function (usuario, callback) {
        console.log('SHA1 contraseña');
        console.log(usuario.Password, sha1(usuario.Password));
        return db.query("INSERT INTO usuario (Nombre, Password, email) values(?,?,?)", [usuario.Nombre, sha1(usuario.Password), usuario.email], (err, count) => {
            db.query("Select idUsuario from usuario ORDER BY idUsuario DESC LIMIT 0, 1", (err, count) => {
                callback(err, count[0])
            });
        });
    },
    addUsuarioRol: function (usuario, callback) {
        return db.query("INSERT INTO userroles (idUsuario, idRol) values(?,?)", [usuario.idUsuario, usuario.idRol], callback);
    },
    deleteusuario: function (id, callback) {
        return db.query("delete from usuario where idUsuario=?", [id], callback);
    },
    updateusuario: function (id, usuario, callback) {
        return db.query("UPDATE usuario set Nombre=?, email=?,firmaUrl=? WHERE idUsuario=?", [usuario.Nombre, usuario.email, usuario.firmaUrl, id], callback);
    },
    updateuserroles: function (id, usuario, callback) {
        return db.query("UPDATE userroles set idRol=? WHERE idUsuario=?", [usuario.idRol, id], callback);
    },
    deleteAll: function (item, callback) {

        var delarr = [];
        for (i = 0; i < item.length; i++) {

            delarr[i] = item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)", [delarr], callback);
    },
    getUnidades: function (callback) {
        return db.query("Select * from geunidad", callback);
    },
    Auth: function (usuario) {
        return new Promise((resolve, reject) => {
            db.query("select u.idusuario as id, Nombre, email, idRol, TipoPesaje from usuario u INNER JOIN userroles ur on u.idUsuario = ur.idUsuario where email=? AND Password=?",
                [usuario.email, sha1(usuario.Password)], (err, result) => {
                    if (err) {
                        resolve([])
                    }
                    resolve(result)
                });


        })
    },
    authProyeccion: function (usuario) {
        return new Promise((resolve, reject) => {
            db.query("select u.idusuario as id, Nombre, email, idRol, TipoPesaje from usuario u INNER JOIN proy_userroles ur on u.idUsuario = ur.idUsuario where email=? AND Password=?",
                [usuario.email, sha1(usuario.Password)], (err, result) => {
                    if (err) {
                        resolve([])
                    }
                    resolve(result)
                });


        })
    },
    version: async function (modulo) {
        try {
            let consulta = await db.query(`SELECT * FROM versionamiento WHERE modulo = ?`, [modulo]);
            return consulta[0];
        } catch (error) {
            console.log('error :>> ', error);
        }
    },
    traerUsuarioPorRol: async function (rol) {
        const connection = await mysql.connection();
        try {
            const usuarios = await connection.query("select u.idusuario as id, Nombre, email, r.*, TipoPesaje from usuario u INNER JOIN userroles ur on u.idUsuario = ur.idUsuario inner join roles r on ur.idRol=r.idRol where r.Rol=?", [rol]);
            if (usuarios.length == 0) {
                throw new Error("El usuario con el rol " + rol + " no existe")
            }
            return usuarios[0]
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }
};
module.exports = usuario;

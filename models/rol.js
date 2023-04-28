var db=require('../dbconnection');

var rol = {

    getAllrol:function(callback){

        return db.query("Select * from roles",callback);

    },
    getrolById:function(id,callback){

        return db.query("select * from roles r LEFT JOIN accionxrol a ON a.idRol = r.idRol where r.idRol = ?",[id],callback);
    },
    addrol:function(rol,callback){
        db.query("INSERT INTO roles (Rol) values(?)",[rol.Rol],(err, response) => {
            db.query("select idRol from roles ORDER BY idRol DESC LIMIT 0, 1", (err,count) => {
                console.log('count idRol', count[0].idRol);
                var separado = [];
                for (var i = 0; i < rol.acciones.length; i++) {
                    separado = rol.acciones[i].split('%%%');
                    if (i == (rol.acciones.length - 1)) {
                        return db.query("INSERT INTO accionxrol (idRol, idAccion, codigo) values(?, ?, ?)",[count[0].idRol, separado[0], separado[1]],callback);
                    } else {
                        db.query("INSERT INTO accionxrol (idRol, idAccion, codigo) values(?, ?, ?)",[count[0].idRol, separado[0], separado[1]],callback);
                    }
                }
            } );
        });

    },
    deleterol:function(id,callback){
        return db.query("delete from roles where idRol=?",[id],callback);
    },
    updaterol:function(id,rol,callback){
        return  db.query("UPDATE roles set Rol=? WHERE idRol=?",[rol.Rol, id], (err, response) => {
            db.query("DELETE FROM accionxrol WHERE idRol = ?", [id], (err,count) => {
                for (var i = 0; i < rol.acciones.length; i++) {
                    separado = rol.acciones[i].split('%%%');
                    if (i == (rol.acciones.length - 1)) {
                        return db.query("INSERT INTO accionxrol (idRol, idAccion, codigo) values(?, ?, ?)",[id, separado[0], separado[1]],callback);
                    } else {
                        db.query("INSERT INTO accionxrol (idRol, idAccion, codigo) values(?, ?, ?)",[id, separado[0], separado[1]],callback);
                    }
                }
            })
        });
    },
    deleteAll:function(item,callback){

        var delarr=[];
        for(i=0;i<item.length;i++){

            delarr[i]=item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)",[delarr],callback);
    },
    getUnidades:function(callback){

        return db.query("Select * from geunidad",callback);

    }
};
module.exports=rol;

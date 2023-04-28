var db=require('../dbconnection');

var acciones = {

    getAllacciones:function(callback){

        return db.query("Select * from acciones a INNER JOIN menu m ON m.idMenu = a.idMenu ORDER BY m.idMenu ASC",callback);

    },
    getaccionesById:function(id,callback){

        return db.query("select * from acciones where idAcciones=?",[id],callback);
    },
    addacciones:function(acciones,callback){
        return db.query("INSERT INTO acciones (Accion, codigo, idMenu) values(?, ?, ?)",[acciones.Accion, acciones.codigo, acciones.idMenu],callback);
    },
    deleteacciones:function(id,callback){
        return db.query("delete from acciones where idAcciones=?",[id],callback);
    },
    updateacciones:function(id,acciones,callback){
        return  db.query("UPDATE acciones set Accion=?, codigo=?, idMenu=? WHERE idAcciones=?",[acciones.Accion, acciones.codigo, acciones.idMenu, id], callback);
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
module.exports=acciones;

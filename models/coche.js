var db=require('../dbconnection');

var coche = {

    getAllCoche:function(callback){

        return db.query("Select * from coche",callback);
    },
    getCocheById:function(id,callback){

        return db.query("select * from coche where idCoche=?",[id],callback);
    },
    addCoche:function(Coche,callback){
        console.log("inside service");
        console.log(Coche.Id);
        return db.query("INSERT INTO coche (Descripcion, Estado) values(?,?)",[Coche.Descripcion, Coche.Estado],callback);
    },
    deleteCoche:function(id,callback){
        return db.query("delete from coche where idCoche=?",[id],callback);
    },
    updateCoche:function(id,Coche,callback){
        return  db.query("UPDATE coche set Descripcion=?, Estado=? WHERE idCoche=?",[Coche.Descripcion, Coche.Estado, id], callback);
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
module.exports=coche;

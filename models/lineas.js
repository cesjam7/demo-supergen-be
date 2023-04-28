var db=require('../dbconnection');

var Linea = {

    getAllLineas:async function(){

        return await db.query("Select * from lineas ORDER BY CodLinea DESC");

    },
    getLineaById:function(id,callback){

        return db.query("select * from lineas where idLinea=?",[id],callback);
    },
    addLinea:function(Linea,callback){
        console.log("inside service");
        console.log(Linea.Id);
        return db.query("INSERT INTO lineas (CodLinea, Linea, Sexo, Estado) values(?,?,?,?)",[Linea.CodLinea, Linea.Linea, Linea.Sexo, Linea.Estado],callback);
    },
    deleteLinea:function(id,callback){
        return db.query("delete from lineas where idLinea=?",[id],callback);
    },
    updateLinea:function(id,Linea,callback){
        return  db.query("UPDATE lineas set CodLinea=?, Linea=?, Estado=?, Sexo=? WHERE idLinea=?",[Linea.CodLinea, Linea.Linea, Linea.Estado,Linea.Sexo, id], callback);
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
module.exports=Linea;

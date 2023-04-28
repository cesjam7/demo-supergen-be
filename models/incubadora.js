var db=require('../dbconnection');

var Incubadora = {

    getAllIncubadora:function(callback){

        return db.query("Select * from incubadora",callback);
    },
    getIncubadoraById:function(id,callback){

        return db.query("select * from incubadora where idIncubadora=?",[id],callback);
    },
    addIncubadora:function(Incubadora,callback){
        console.log("inside service");
        console.log(Incubadora.Id);
        return db.query("INSERT INTO incubadora (Descripcion, Estado) values(?,?)",[Incubadora.Incubadora, Incubadora.Estado],callback);
    },
    deleteIncubadora:function(id,callback){
        return db.query("delete from incubadora where idIncubadora=?",[id],callback);
    },
    updateIncubadora:function(id,Incubadora,callback){
        return  db.query("UPDATE incubadora set Descripcion=?, Estado=? WHERE idIncubadora=?",[Incubadora.Descripcion, Incubadora.Estado, id], callback);
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
module.exports=Incubadora;

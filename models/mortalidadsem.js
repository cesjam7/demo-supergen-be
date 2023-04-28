var db=require('../dbconnection');

var mortalidadsem = {

    getAllmortalidadsem:function(callback){

        return db.query("Select * from mortalidadsem",callback);

    },
    getmortalidadsemById:function(id,callback){

        return db.query("select * from mortalidadsem where idMortalidadSem=?",[id],callback);
    },
    addmortalidadmem:function(mortalidadsem,callback){
        console.log("inside service");
        console.log(mortalidadsem.Id);
        return db.query("INSERT INTO mortalidadsem (idMortalidad, idLote, idLinea, Semana, NoAves, PorcMortalidad, NoEliminados, PorcEliminados) values(?,?,?,?,?,?,?,?)",[MortalidadSem.idMortalidad, MortalidadSem.idLote, MortalidadSem.idLinea, MortalidadSem.Semana, MortalidadSem.NoAves, MortalidadSem.PorcMortalidad, MortalidadSem.NoEliminados, MortalidadSem.PorcEliminados],callback);
    },
    deleteMortalidadSem:function(id,callback){
        return db.query("delete from mortalidadsem where idMortalidadSem=?",[id],callback);
    },
    updateMortalidadSem:function(id,MortalidadSem,callback){
        return  db.query("UPDATE mortalidadsem set idMortalidad=?, idLote=?, idLinea=?, Semana=?, NoAves=?, PorcMortalidad=?, NoEliminados=?, PorcEliminados=? WHERE idMortalidadSem=?",[MortalidadSem.idMortalidad, MortalidadSem.idLote, MortalidadSem.idLinea, MortalidadSem.Semana, MortalidadSem.NoAves, MortalidadSem.PorcMortalidad, MortalidadSem.NoEliminados, MortalidadSem.PorcEliminados, id], callback);
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
module.exports=mortalidadsem;

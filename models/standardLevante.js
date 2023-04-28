var db=require('../dbconnection');

var standardlevante = {

    getAllstandard_levante:async function(){
        return await db.query("Select * from standard_levante ORDER BY Semana");
    },
    getstandardlevanteById:function(id,callback){

        return db.query("select * from standard_levante where idStandard_levante=?",[id],callback);
    },
    getstandardlevanteByIdSemana:function(id,callback){
        return db.query("SELECT  * FROM standard_levante WHERE Semana=?",[id],callback);
    },


    addstandardlevante:async function(sl){
        return await db.query(`INSERT INTO standard_levante (Semana, Mortalidad_sem, Mortalidad_Acum, PesoH_L9, 
        PesoH_L9_SPG83, PesoH_L4, PesoM_L7, PesoM_L1, GramoAveH_L9, GramoAveH_L9_SPG83, GramoAveH_L4, 
        GramoAveM_L7, GramoAveM_L1, GramoAveM_SG_L7, GramoAveM_SG_L1, KCal_dia_H, KCal_dia_M, 
        GramoProteina_H, GramoProteina_M ) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[sl.Semana, 
        sl.Mortalidad_sem, sl.Mortalidad_Acum, sl.PesoH_L9, sl.PesoH_L9_SPG83, sl.PesoH_L4, sl.PesoM_L7, 
        sl.PesoM_L1, sl.GramoAveH_L9, sl.GramoAveH_L9_SPG83, sl.GramoAveH_L4, sl.GramoAveM_L7, sl.GramoAveM_L1,
        sl.GramoAveM_SG_L7, sl.GramoAveM_SG_L1, sl.KCal_dia_H, sl.KCal_dia_M, sl.GramoProteina_H, 
        sl.GramoProteina_M]);
    },
    deletestandardlevante:function(id,callback){
        return db.query("delete from standard_levante where idStandard_levante=?",[id],callback);
    },
    updatestandardlevante:async function(id,sl){
        return await db.query(`UPDATE standard_levante set Semana=?, Mortalidad_sem=?, Mortalidad_Acum=?, 
        PesoH_L9=?, PesoH_L9_SPG83=?, PesoH_L4=?, PesoM_L7=?, PesoM_L1=?, GramoAveH_L9=?, GramoAveH_L9_SPG83=?,
        GramoAveH_L4=?, GramoAveM_L7=?, GramoAveM_L1=?, GramoAveM_SG_L7=?, GramoAveM_SG_L1=?, KCal_dia_H=?, 
        KCal_dia_M=?, GramoProteina_H=?, GramoProteina_M=? WHERE idStandard_levante=?`,[sl.Semana, 
        sl.Mortalidad_sem, sl.Mortalidad_Acum, sl.PesoH_L9, sl.PesoH_L9_SPG83, sl.PesoH_L4, sl.PesoM_L7,
        sl.PesoM_L1, sl.GramoAveH_L9, sl.GramoAveH_L9_SPG83, sl.GramoAveH_L4, sl.GramoAveM_L7, sl.GramoAveM_L1,
        sl.GramoAveM_SG_L7, sl.GramoAveM_SG_L1, sl.KCal_dia_H, sl.KCal_dia_M, sl.GramoProteina_H, 
        sl.GramoProteina_M, id]);
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
module.exports= standardlevante;

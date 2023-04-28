var db=require('../dbconnection');

var standardprodhembra = {

    getAllstandard_prod_hembra:async function(){

        return await db.query("Select * from standard_prod_hembra ORDER BY Semana");

    },
    getstandardprodhembraById:function(id,callback){

        return db.query("select * from standard_prod_hembra where idStandard_prod_Hembra=?",[id],callback);
    },
    addstandardprodhembra:function(standardprodhembra,callback){
        console.log("inside service");
        console.log(standardprodhembra.Id);
        return db.query("INSERT INTO standard_prod_hembra (Semana, idprod, Mortalidad_sem, Mortalidad_Acum, PesoH_L9, PesoM_L7, PesoM_L7_SG, GramoAveDia_H_L9, GramoAveDia_M_L7, GramoAveDia_M_L7_SG, KCalDia_H_L9, KCalDia_M_L7, GramoProt_H_L9, GramoProt_M_L7, Prodtot_Sem, TotalHGallinaEnc_Sem, TotalHGallinaEnc_Acum, HIGallinaEnc_Sem, HIGallinaEnc_Acum, Porc_HI, PesoHuevo, MasaHuevo, Fertilidad, Porc_Nacim_total, TotPollito_GallinaEnc_sem, TotPollito_GallinaEnc_Acum ) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[standardprodhembra.Semana, standardprodhembra.idprod, standardprodhembra.Mortalidad_sem, standardprodhembra.Mortalidad_Acum, standardprodhembra.PesoH_L9, standardprodhembra.PesoM_L7, standardprodhembra.PesoM_L7_SG, standardprodhembra.GramoAveDia_H_L9, standardprodhembra.GramoAveDia_M_L7, standardprodhembra.GramoAveDia_M_L7_SG, standardprodhembra.KCalDia_H_L9, standardprodhembra.KCalDia_M_L7, standardprodhembra.GramoProt_H_L9, standardprodhembra.GramoProt_M_L7, standardprodhembra.Prodtot_Sem, standardprodhembra.TotalHGallinaEnc_Sem, standardprodhembra.TotalHGallinaEnc_Acum, standardprodhembra.HIGallinaEnc_Sem, standardprodhembra.HIGallinaEnc_Acum, standardprodhembra.Porc_HI, standardprodhembra.PesoHuevo, standardprodhembra.MasaHuevo, standardprodhembra.Fertilidad, standardprodhembra.Porc_Nacim_total, standardprodhembra.TotPollito_GallinaEnc_sem, standardprodhembra.TotPollito_GallinaEnc_Acum ],callback);
    },
    deletestandardprodhembra:function(id,callback){
        return db.query("delete from standard_prod_hembra where idStandard_prod_Hembra=?",[id],callback);
    },
    updatestandardprodhembra:function(id,standardprodhembra,callback){
        return  db.query("UPDATE standard_prod_hembra set Semana=?, idprod=?, Mortalidad_sem=?, Mortalidad_Acum=?, PesoH_L9=?, PesoM_L7=?, PesoM_L7_SG=?, GramoAveDia_H_L9=?, GramoAveDia_M_L7=?, GramoAveDia_M_L7_SG=?, KCalDia_H_L9=?, KCalDia_M_L7=?, GramoProt_H_L9=?, GramoProt_M_L7=?, Prodtot_Sem=?, TotalHGallinaEnc_Sem=?, TotalHGallinaEnc_Acum=?, HIGallinaEnc_Sem=?, HIGallinaEnc_Acum=?, Porc_HI=?, PesoHuevo=?, MasaHuevo=?, Fertilidad=?, Porc_Nacim_total=?, TotPollito_GallinaEnc_sem=?, TotPollito_GallinaEnc_Acum=?  WHERE idStandard_prod_Hembra=?",[standardprodhembra.Semana, standardprodhembra.idprod, standardprodhembra.Mortalidad_sem, standardprodhembra.Mortalidad_Acum, standardprodhembra.PesoH_L9, standardprodhembra.PesoM_L7, standardprodhembra.PesoM_L7_SG, standardprodhembra.GramoAveDia_H_L9, standardprodhembra.GramoAveDia_M_L7, standardprodhembra.GramoAveDia_M_L7_SG, standardprodhembra.KCalDia_H_L9, standardprodhembra.KCalDia_M_L7, standardprodhembra.GramoProt_H_L9, standardprodhembra.GramoProt_M_L7, standardprodhembra.Prodtot_Sem, standardprodhembra.TotalHGallinaEnc_Sem, standardprodhembra.TotalHGallinaEnc_Acum, standardprodhembra.HIGallinaEnc_Sem, standardprodhembra.HIGallinaEnc_Acum, standardprodhembra.Porc_HI, standardprodhembra.PesoHuevo, standardprodhembra.MasaHuevo, standardprodhembra.Fertilidad, standardprodhembra.Porc_Nacim_total, standardprodhembra.TotPollito_GallinaEnc_sem, standardprodhembra.TotPollito_GallinaEnc_Acum, id], callback);
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
module.exports=standardprodhembra;

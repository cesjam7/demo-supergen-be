var db=require('../dbconnection');

var standardprodmacho = {

    getAllstandard_prod_macho:async function(){

        return await db.query("Select * from standard_prod_macho ORDER BY Semana");

    },
    getstandardprodmachoById:function(id,callback){

        return db.query("select * from standard_prod_macho where idStandard_prod_Macho=?",[id],callback);
    },
    addstandardprodmacho:function(standardprodmacho,callback){
        console.log("inside service");
        console.log(standardprodmacho.Id);
        return db.query("INSERT INTO standard_prod_macho (Semana, idprod, ProdTotal_Std, HI_Std, PesoHuevo, PesoH_L4, PesoM_L1, PesoM_L1_SG, GramoAveDia_H_L4, GramoAveDia_M_L1, GramoAveDia_M_L1_SG, Total_H_GallinaEnc_Sem, Total_H_GallinaEnc_Acum, HI_GallinaEnc_Sem, HI_GallinaEnc_Acum, Porc_HI, PesoHuevo_HI, MasaHuevo_HI, Porc_Nacim) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[standardprodmacho.Semana, standardprodmacho.idprod, standardprodmacho.ProdTotal_Std, standardprodmacho.HI_Std, standardprodmacho.PesoHuevo, standardprodmacho.PesoH_L4, standardprodmacho.PesoM_L1, standardprodmacho.PesoM_L1_SG, standardprodmacho.GramoAveDia_H_L4, standardprodmacho.GramoAveDia_M_L1, standardprodmacho.GramoAveDia_M_L1_SG, standardprodmacho.Total_H_GallinaEnc_Sem, standardprodmacho.Total_H_GallinaEnc_Acum, standardprodmacho.HI_GallinaEnc_Sem, standardprodmacho.HI_GallinaEnc_Acum, standardprodmacho.Porc_HI, standardprodmacho.PesoHuevo_HI, standardprodmacho.MasaHuevo_HI, standardprodmacho.Porc_Nacim ],callback);
    },
    deletestandardprodmacho:function(id,callback){
        return db.query("delete from standard_prod_macho where idStandard_prod_Macho=?",[id],callback);
    },
    updatestandardprodmacho:function(id,standardprodmacho,callback){
        return  db.query("UPDATE standard_prod_macho set Semana=?, idprod=?, ProdTotal_Std=?, HI_Std=?, PesoHuevo=?, PesoH_L4=?, PesoM_L1=?, PesoM_L1_SG=?, GramoAveDia_H_L4=?, GramoAveDia_M_L1=?, GramoAveDia_M_L1_SG=?, Total_H_GallinaEnc_Sem=?, Total_H_GallinaEnc_Acum=?, HI_GallinaEnc_Sem=?, HI_GallinaEnc_Acum=?, Porc_HI=?, PesoHuevo_HI=?, MasaHuevo_HI=?, Porc_Nacim=?  WHERE idStandard_prod_Macho=?",[standardprodmacho.Semana, standardprodmacho.idprod, standardprodmacho.ProdTotal_Std, standardprodmacho.HI_Std, standardprodmacho.PesoHuevo, standardprodmacho.PesoH_L4, standardprodmacho.PesoM_L1, standardprodmacho.PesoM_L1_SG, standardprodmacho.GramoAveDia_H_L4, standardprodmacho.GramoAveDia_M_L1, standardprodmacho.GramoAveDia_M_L1_SG, standardprodmacho.Total_H_GallinaEnc_Sem, standardprodmacho.Total_H_GallinaEnc_Acum, standardprodmacho.HI_GallinaEnc_Sem, standardprodmacho.HI_GallinaEnc_Acum, standardprodmacho.Porc_HI, standardprodmacho.PesoHuevo_HI, standardprodmacho.MasaHuevo_HI, standardprodmacho.Porc_Nacim, id], callback);
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
module.exports=standardprodmacho;

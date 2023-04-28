var db = require('../dbconnection');
const { rows } = require('mssql');

let cierreProd = {

    VerifyUpdatesProd: async (Mortalidades) => {
        let cerrado = false;
        try {
            let { edad, semana  ,idProduccion } = Mortalidades;
            console.log(semana, idProduccion)
            if(semana){
                let info_semana = await db.query(`SELECT * FROM mortalidad_prod_sem WHERE semana_prod = ? 
                and idProduccion = ?`, [semana, idProduccion]);
                if (info_semana.length != 0) {
                    if (info_semana[0].Estado == 0) {
                        cerrado = true;
                    }
                }
                
            }else{
                let Semana = Math.ceil(edad / 7);
                let info_semana = await db.query(`SELECT * FROM mortalidad_prod_sem WHERE semana_prod = ? 
                and idProduccion = ?`, [Semana, idProduccion]);
                if (info_semana.length != 0) {
                    if (info_semana[0].Estado == 0) {
                        cerrado = true;
                    }
                }
            }
        } catch (error) {
            console.log('error', error)
        }
        return cerrado;
    }
}
module.exports = cierreProd
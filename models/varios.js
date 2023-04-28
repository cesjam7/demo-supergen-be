const db = require('../dbconnection');


const varios = {
    updateEstadoFechaCierreAndUsuarioRevisionFindReq: (req) => {
        return new Promise((resolve, reject) => {
            db.query("update requerimiento  SET Estado = ? ,Fecha_revision=?,idUsuarioRevision=? where idRequerimiento=? ", [2, new Date(), req.user, req.id], (err, result) => {
                if (err) reject(err)

                resolve()
            })
        })

    },
    consultaVarios: async function () {
        const dataMortalidadLevanteDetalle = await db.query(`select fecha,idlevante,count(*) nro from mortalidad_det group by fecha,idlevante
having count(*)<>4
`)
        const dataMortalidLevanteCabecera = await db.query(`select idlevante,edad,count(*) nro  from mortalidad group  by idlevante,edad having count(*)>1`)
        const dataMortalidadProduccionCabecera = await db.query(`select idProduccion,edad,count(*) nro from mortalidad_prod_json group  by idProduccion,edad having count(*)>1`)
        const dataMortalidadProduccionDetalle = await db.query(`select fecha,idProduccion,count(*) nro from mortalidad_prod_det group by fecha,idProduccion
        having count(*)<>4 order by fecha
        `)
        const dataAlimentoLevanteDetalle = await db.query(`select idlevante,idlote,idalimento,fecha,count(*) nro from alimento_levante_det 
where cantalimento>0
group by idlevante,idlote,idalimento,fecha
having count(*)>1
`)

        const dataAlimentoLevanteCabecera = await db.query(`select idAlimento,idLevante,Edad,count(*) nro from alimento_levantejson group by idAlimento,idLevante,Edad
having count(*)>1
`)
        const dataAlimentoProduccionDetalle = await db.query(`select idProduccion,idLote,idalimento,Fecha,count(*) nro from alimento_prod_det 
where CantAlimento>0
group by idProduccion,idLote,idalimento,Fecha
having count(*)>1
`)
        const dataAlimentoProduccionCabecera = await db.query(`select idAlimento,idProduccion,Edad,count(*) nro from alimento_prod_json group by idAlimento,idProduccion,Edad
having count(*)>1
`)
        return { dataMortalidadLevanteDetalle, dataMortalidLevanteCabecera, dataMortalidadProduccionCabecera, dataMortalidadProduccionDetalle, dataAlimentoLevanteDetalle, dataAlimentoLevanteCabecera, dataAlimentoProduccionDetalle, dataAlimentoProduccionCabecera }
    }

}
module.exports = varios;
const moment = require('moment');
var db = require('../dbconnection');
const cotizacion = require("./cotizacion")
const requerimientoModel = require("./requerimientos");
const estadisticaReqModel = {
    update: () => {


    },
    guardarCodigoEsoftcom: function (cotizacionCabecera, codigoEsoftCom) {
        return new Promise(async (resolve, reject) => {
            try {
                const cotizacionesDetalle = await cotizacion.detalleProvPorCotizacion(cotizacionCabecera.id)
                const cotizacionesFilter = cotizacionesDetalle.filter((cotizacion) => [1, 3].includes(cotizacion.estado.state))
                const cotizacionDetConRequerimiento = [];
                for (let i = 0; i < cotizacionesFilter.length; i++) {
                    const requerimiento = (await requerimientoModel.getCantidadCotizadaConRequerimientoPorRequerimientoDetId(cotizacionesFilter[i].idRequerimientoDet))
                    cotizacionDetConRequerimiento.push({ ...requerimiento, ...cotizacionesFilter[i] })
                }
                const cotizacionDetValue = cotizacionDetConRequerimiento.map((cotizacion) => ([cotizacion.nombreReq, cotizacion.cod_prod, cotizacion.detalle_prod, cotizacion.cantidadAprobada, cotizacion.cantidad, codigoEsoftCom.toString().padStart(7, "0"), cotizacionCabecera.nroCotizacion, cotizacion.ccosto, new Date(), cotizacionCabecera.fecha_registro]))
                db.query("insert into estadistica_req(codigoRequerimiento,codigoProd,detalle,cantidadReq,cantidadCoti,numeroReqSof,numeroCotizacion,ccosto,fechaReqSoft,fechaCotizacion) values ?", [cotizacionDetValue], (err, results) => {
                    if (err) {
                        console.log("err", err)
                        reject(err)
                    }
                    resolve();
                })

            } catch (error) {
                console.log("err", error)
                reject(error)
            }
        })
    }

}
module.exports = estadisticaReqModel;
<<<<<<< HEAD
/*

const c = require("./models/cotizacion");
var service = {
  "store": "0002",
  "fecha_transferencia": null,
  "fecha_registro": "2021-02-01",
  "moneda": "MN",
  "usuarioTransferencia": null,
  "fecha_aprobacion": "2021-02-01",
  "id": 38,
  "tipoReq": 2,
  "ccosto": "admin",
  "familia": "SERVICIO",
  "estado": 3,
  "upp": "admin",
  "nroCotizacion": 10,
  "fechaCotizacion": "2021-02-01",
  "idUsuario": 1,
  "Nombre": "admin",
  "idSolicitante": "01",
  "solicitado": {
      "id": 1,
      "nombre": "admin"
  },
  "selected": true,
  "disabled": false,
  "cotizaciones": [
      {
          "id": 94,
          "idItem": 1,
          "precio": 10,
          "total": 10,
          "cantidad": 1,
          "detalle_prod": "MANTENIMIENTO Y REPARACION DE MAQUINARIA Y EQUIPO",
          "formaPago": "02",
          "lugarEntrega": "tu casa",
          "fechaEntrega": "2021-02-01",
          "cod_prod": "10113260001",
          "um": "UND",
          "nombreProv": "A6N-851",
          "idRequerimientoDet": 60,
          "codProv": "A6N-851",
          "idCotizacion": 38,
          "estado": 1,
          "producto": {
              "descripcion": "MANTENIMIENTO Y REPARACION DE MAQUINARIA Y EQUIPO",
              "codigoProducto": "10113260001",
              "um": "UND",
              "idRequerimientoDet": 60
          },
          "proveedorCotizacion": {
              "precio": 10,
              "AC_CNOMBRE": "A6N-851",
              "AC_CCODIGO": "A6N-851"
          }
      }
  ],
  "tipoCambio": 3.587,
  "numeroMaximoEsoftcom": 10,
  "mostrarInput": false,
  "nroCotizacionProveedor": "AA0"
};
var args = {
  fecha_transferencia: '2021-01-29T05:00:00.000Z',
  fecha_registro: '2021-01-29',
  moneda: 'MN',
  usuarioTransferencia: 'admin',
  fecha_aprobacion: '2021-01-29',
  id: 36,
  tipoReq: 1,
  ccosto: 'plant',
  familia: 'ENVASES',
  estado: 5,
  upp: 'plant',
  nroCotizacion: 8,
  fechaCotizacion: '2021-01-29',
  idUsuario: 1,
  Nombre: 'admin',
  idSolicitante: '04',
  solicitado: { id: 1, nombre: 'admin' },
  selected: true,
  disabled: false,
  cotizaciones: [
    {
      id: 93,
      idItem: 1,
      precio: 12,
      total: 42000,
      cantidad: 3500,
      detalle_prod: 'BANDEJA DE CARTON PARA HUEVO',
      formaPago: '01',
      lugarEntrega: 'HUACHO',
      fechaEntrega: '2021-02-07',
      cod_prod: '4106150003',
      um: 'UND',
      nombreProv: 'MOLPACK DEL PERU S.A.',
      idRequerimientoDet: 56,
      codProv: '20548312184',
      idCotizacion: 36,
      estado: 1,
      producto: [Object],
      proveedorCotizacion: [Object]
    }
  ],
  tipoCambio: 3.587,
  numeroMaximoEsoftcom: 10,
  mostrarInput: false,
  nroCotizacionProveedor: 'UUEUEU'
};
c.quotationToEsoftt(service, 1);

*/
const moment=require("moment")
const tareo=require("./models/tareo");
async function get(){
  const fechaIni = moment("2021-02-07").subtract(5, "days").format("YYYY-MM-DD");
        const fechaFin = moment("2021-02-07").add(1, "day").format("YYYY-MM-DD");
        const params = {
            fechaIni,
            fechaFin,
            departamento: { id: 2 }
        }
        console.log(params);
  const data = await tareo.tareoConsultaFiltrado(params)
  console.log(data)
}
get();
=======
/*

const c = require("./models/cotizacion");
var service = {
  "store": "0002",
  "fecha_transferencia": null,
  "fecha_registro": "2021-02-01",
  "moneda": "MN",
  "usuarioTransferencia": null,
  "fecha_aprobacion": "2021-02-01",
  "id": 38,
  "tipoReq": 2,
  "ccosto": "admin",
  "familia": "SERVICIO",
  "estado": 3,
  "upp": "admin",
  "nroCotizacion": 10,
  "fechaCotizacion": "2021-02-01",
  "idUsuario": 1,
  "Nombre": "admin",
  "idSolicitante": "01",
  "solicitado": {
      "id": 1,
      "nombre": "admin"
  },
  "selected": true,
  "disabled": false,
  "cotizaciones": [
      {
          "id": 94,
          "idItem": 1,
          "precio": 10,
          "total": 10,
          "cantidad": 1,
          "detalle_prod": "MANTENIMIENTO Y REPARACION DE MAQUINARIA Y EQUIPO",
          "formaPago": "02",
          "lugarEntrega": "tu casa",
          "fechaEntrega": "2021-02-01",
          "cod_prod": "10113260001",
          "um": "UND",
          "nombreProv": "A6N-851",
          "idRequerimientoDet": 60,
          "codProv": "A6N-851",
          "idCotizacion": 38,
          "estado": 1,
          "producto": {
              "descripcion": "MANTENIMIENTO Y REPARACION DE MAQUINARIA Y EQUIPO",
              "codigoProducto": "10113260001",
              "um": "UND",
              "idRequerimientoDet": 60
          },
          "proveedorCotizacion": {
              "precio": 10,
              "AC_CNOMBRE": "A6N-851",
              "AC_CCODIGO": "A6N-851"
          }
      }
  ],
  "tipoCambio": 3.587,
  "numeroMaximoEsoftcom": 10,
  "mostrarInput": false,
  "nroCotizacionProveedor": "AA0"
};
var args = {
  fecha_transferencia: '2021-01-29T05:00:00.000Z',
  fecha_registro: '2021-01-29',
  moneda: 'MN',
  usuarioTransferencia: 'admin',
  fecha_aprobacion: '2021-01-29',
  id: 36,
  tipoReq: 1,
  ccosto: 'plant',
  familia: 'ENVASES',
  estado: 5,
  upp: 'plant',
  nroCotizacion: 8,
  fechaCotizacion: '2021-01-29',
  idUsuario: 1,
  Nombre: 'admin',
  idSolicitante: '04',
  solicitado: { id: 1, nombre: 'admin' },
  selected: true,
  disabled: false,
  cotizaciones: [
    {
      id: 93,
      idItem: 1,
      precio: 12,
      total: 42000,
      cantidad: 3500,
      detalle_prod: 'BANDEJA DE CARTON PARA HUEVO',
      formaPago: '01',
      lugarEntrega: 'HUACHO',
      fechaEntrega: '2021-02-07',
      cod_prod: '4106150003',
      um: 'UND',
      nombreProv: 'MOLPACK DEL PERU S.A.',
      idRequerimientoDet: 56,
      codProv: '20548312184',
      idCotizacion: 36,
      estado: 1,
      producto: [Object],
      proveedorCotizacion: [Object]
    }
  ],
  tipoCambio: 3.587,
  numeroMaximoEsoftcom: 10,
  mostrarInput: false,
  nroCotizacionProveedor: 'UUEUEU'
};
c.quotationToEsoftt(service, 1);

*/
const moment=require("moment")
const tareo=require("./models/tareo");
async function get(){
  const fechaIni = moment("2021-02-07").subtract(5, "days").format("YYYY-MM-DD");
        const fechaFin = moment("2021-02-07").add(1, "day").format("YYYY-MM-DD");
        const params = {
            fechaIni,
            fechaFin,
            departamento: { id: 2 }
        }
        console.log(params);
  const data = await tareo.tareoConsultaFiltrado(params)
  console.log(data)
}
get();
>>>>>>> e062686850aca5c344efcb66acf81305d356e168

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var cron = require('node-cron');
var os = require('os');
let hostname = os.hostname();
var fs = require('fs');
var db = require('./dbconnection');

var routes = require('./routes/index');
const requerimientoModel = require("./models/requerimientos");
const periodoF33Model = require("./models/periodo_f33");
var usuario = require('./routes/usuario');
var rol = require('./routes/rol');
const provisionCosteoRoute = require('./routes/provisionCosteo');
var lineas = require('./routes/lineas');
var granjas = require('./routes/granjas');
var galpones = require('./routes/galpones');
var corrales = require('./routes/corrales');
var lotes = require('./routes/lotes');
var levantes = require('./routes/levantes');
var mortalidad = require('./routes/mortalidad');
var mortalidadsem = require('./routes/mortalidadsem');
var menu = require('./routes/menu');
var categorias = require('./routes/categorias');
var acciones = require('./routes/acciones');
var alimentos = require('./routes/alimentos');
var standardlevante = require('./routes/standardLevante');
var standardprodhembra = require('./routes/standardprodhembra');
var standardprodmacho = require('./routes/standardprodmacho');
var levanteAlimento = require('./routes/levanteAlimento');
var levantePeso = require('./routes/levantePeso');
var levanteSemana = require('./routes/levanteSemana');
var produccion = require('./routes/produccion');
var produccionPeso = require("./routes/produccionPeso");
var produccionMortalidad = require("./routes/produccionMortalidad");
var produccionAlimento = require("./routes/produccionAlimento");
var produccionHuevos = require("./routes/produccionHuevos");
var produccionTraslado = require("./routes/produccionTraslado");
var produccionSemana = require("./routes/produccionSemana");
var incubadora = require("./routes/incubadora");
var coche = require("./routes/coche");
var cargos = require("./routes/cargos");
var produccionDespacho = require("./routes/produccionDespacho");
var nacimiento = require("./routes/nacimiento");
var nacimiento_reporte = require("./routes/nacimiento-reporte");
var periodo = require("./routes/periodo")
var periodoTareo = require("./routes/periodoTareo")
var periodoF33 = require("./routes/periodo_f33")
var costeo = require("./routes/costeo")
var DBCostsSG = require("./routes/DBCostsSG");
var enfermedades = require("./routes/enfermedades");
var standardSerologia = require("./routes/standardSerologia");
var vacunas = require("./routes/vacunas");
var distribuidoras = require("./routes/distribuidoras");
var laboratorios = require("./routes/laboratorios");
var resultadosSerologia = require("./routes/resultados-serologia");
var programaVacunacion = require("./routes/programa-vacunacion");
let depreciacion = require("./routes/depreciacion")
let variablesPlanta = require("./routes/variables-planta");
let Cartilla = require("./routes/Cartilla");
let Aviagen = require("./routes/Aviagen");
let Cierre = require('./routes/cierre');
let cierreProd = require('./routes/cierreProd');
let tareo = require('./routes/tareo');
let tareoConsultaDetalle = require('./routes/tareoConsultaDetalle');
let ReporteProduccion = require('./routes/ReporteProduccion');
let clientes = require('./routes/clientes');
let requerimiento = require('./routes/requerimiento');
const contabCpeRoutes = require('./routes/contab_cpe');
const cajaChicaRoutes = require('./routes/cajaChica')
let comprobantes = require('./routes/comprobantes');
const logisticaConsultaRoutes = require("./routes/logistica-consulta")
const proyRol = require("./routes/proyRol");
const proyPedidoVentaRoute = require("./routes/proyPedidoVenta")
const proyPedidoVentaDetalleRoute = require("./routes/proyPedidoVentaDetalle")
const proyAccion = require("./routes/proyAcciones");
const proyLoteDetalle = require("./routes/proy_loteDetalle");
const proyMenu = require("./routes/proyMenu");
const proyFactor = require("./routes/proyFactores");
const proyIngresoLotes = require("./routes/proy_ingresoLotes");
const cotizacionRouter = require("./routes/cotizacion")
const salidasHuevosComercialesRoute = require("./routes/SalidasHuevosComerciales")
const areaRoute = require("./routes/area")
const solicitanteRoute = require("./routes/solicitante")
const logisticaConsultaModel = require("./models/logistica-consulta")
const DBalimentoSGRouter = require("./routes/DBAlimentosSG");
const proyStandardHembra = require("./routes/proyStandardHembra");
const proyStandardMacho = require("./routes/proyStandardMacho");
const mortalidadDiaria = require("./routes/mortalidadDiaria");
const mortalidadDiariaF33 = require("./routes/mortalidadDiariaF33");
const produccionHuevosModel = require("./models/produccionHuevos")
const tipoDocumentoContabilidadRouter = require("./routes/tipoDocumentoContabilidad")
const fileRouter = require("./routes/file")
const tareoModel = require("./models/tareo")
const planillaMovilidadRoute = require("./routes/planillaMovilidad")
const destinatariosCargasRoute = require("./routes/destinatarioCargasRoute")
const alimentoModel = require("./models/alimentos")
const prodLogsRoute = require("./routes/prodLog")
const fcTipoFlujoRouter = require("./routes/fc_tipoFlujo")
const fcFamiliaRouter = require("./routes/fc_familia")
const fcSubFamiliaRouter = require("./routes/fc_subFamilia")
const fcCuentaContableRouter = require("./routes/fc_cuentaContable")
const fcTipoServicioRouter = require("./routes/fc_tipoServicio")
const provisionCierreRouter = require("./routes/provisionCierre")
const provisionCtsRoute = require("./routes/provisionCts")
const provisionVacacionesRoute = require("./routes/provisionVacaciones")
const provisionGratificacionRoute = require("./routes/provisionGratificacion")
const granjaSolicitudAperturaRoute = require("./routes/granjaSolicitudApertura")
const provisionAperturaRoute = require("./routes/provisionApertura")
const fcPeriodo = require("./routes/fc_periodo")
const fcProveedorTipoServicio = require("./routes/fc_proveedor-tipo-servicio")
const fcTipDocRoute = require("./routes/fc_tipoDoc")
const fcFlujoProyectado = require("./routes/fc_proyectado")
const fcTipoAnexoRoute = require("./routes/fc_tipo_anexo")
const granjaAlimentacionResponsable = require("./routes/alimentacionResponsable")
const granjaAlimentacionResponsableNucleo = require("./routes/alimentacionResponsableNucleo")
const fcFlujoReal = require("./routes/fc_real")
const alimentacionTarifaRoute = require("./routes/alimentacionTarifa")
const alimentacionRutaRoute = require("./routes/alimentacionRuta")
const alimentacionTarifaRutaRoute = require("./routes/alimentacionTarifaRuta")
const flujoCajaPlanillasRoute = require("./routes/flujoCajaPlanillas")
const alimentacionResponsableNucleoDetalle = require("./routes/alimentacionResponsableNucleoDet")
const flujoRealProyectadoRoute = require("./routes/flujoProyectadoReal")
const flujoGraficosRoute = require("./routes/fc_graficos")
const confirmacionRutaRoute = require("./routes/confirmacion-ruta")
const variosRoute = require("./routes/varios")

const produccionCartillaVirtualRouet = require("./routes/produccionCartillaVirtual")
const levanteCartillaVirtualRoute = require("./routes/levanteCartillaVirtual")
const estadisticaRoute = require("./routes/estadistica")
const alimentacionCosteoRoute = require("./routes/alimentacionCosteo")
const planillaMensualRoute = require("./routes/planillaMensual")
const requerimientoModelo = require("./models/requerimientos")
// POULTRY
var poultry = require("./routes/poultry");
// EMAIL
var sendEmailModel = require('./models/sendEmail');
const moment = require('moment');
const { Buffer } = require('buffer');
const { poolPromise } = require('./dbconnectionMSSQL');

const mortalidadModelo = require("./models/mortalidad")
//const PORT = process.env.PORT || 8082;

const PORT = process.env.PORT || 8192;
var app = express();

process.on('uncaughtException', function (err) {
    console.log(err);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

app.use(cookieParser());

//app.use(express.static('/uploads/'));

app.use('/images', express.static(__dirname + '/images'));
/*So now, you can use http://localhost:5000/resources/myImage.jpg to serve all the images instead of http://localhost:5000/images/myImage.jpg. */
app.use('/', routes);
app.use("/huevoscomerciales", salidasHuevosComercialesRoute)
app.use("/granjaAlimentacionResponsable", granjaAlimentacionResponsable)
app.use("/granjaAlimentacionResponsableNucleo", granjaAlimentacionResponsableNucleo)
app.use("/fcTipoFlujo", fcTipoFlujoRouter)
app.use("/fcPeriodo", fcPeriodo)
app.use("/fcFamilia", fcFamiliaRouter)
app.use("/fcSubFamilia", fcSubFamiliaRouter)
app.use("/fcCuentaContable", fcCuentaContableRouter)
app.use("/varios", variosRoute)
app.use("/fcTipoServicio", fcTipoServicioRouter)
app.use("/movimientoAlimento", DBalimentoSGRouter);
app.use('/usuario', usuario);
app.use('/solicitante', solicitanteRoute);
app.use('/area', areaRoute);
app.use('/rol', rol);
app.use("/proyRol", proyRol);
app.use("/provisionCierre", provisionCierreRouter);
app.use("/proyAccion", proyAccion);
app.use("/proyMenu", proyMenu)
app.use("/proyLoteDetalle", proyLoteDetalle)
app.use('/lineas', lineas);
app.use('/granjas', granjas);
app.use('/galpones', galpones);
app.use('/corrales', corrales);
app.use('/incubadora', incubadora);
app.use('/coche', coche);
app.use("/file", fileRouter)
app.use("/standardMacho", proyStandardMacho)
app.use("/standardHembra", proyStandardHembra)
app.use("/planillaMovilidad", planillaMovilidadRoute)
app.use('/lotes', lotes);
app.use('/levantes', levantes);
app.use('/mortalidad', mortalidad);
app.use("/logistica-consulta", logisticaConsultaRoutes)

app.use("/pedidoVenta", proyPedidoVentaRoute);
app.use("/pedidoVentaDetalle", proyPedidoVentaDetalleRoute);
app.use("/contabCpe", contabCpeRoutes)
app.use("/proyIngresoLote", proyIngresoLotes)
app.use('/mortalidadsem', mortalidadsem);
app.use('/menu', menu);
app.use('/categorias', categorias);
app.use('/acciones', acciones);
app.use("/cajaChica", cajaChicaRoutes)
app.use('/standardlevante', standardlevante);
app.use("/factor", proyFactor)
app.use('/standardprodhembra', standardprodhembra);
app.use('/standardprodmacho', standardprodmacho);
app.use('/alimentos', alimentos);
app.use('/levanteAlimento', levanteAlimento);
app.use('/levantePeso', levantePeso);
app.use('/levanteSemana', levanteSemana);
app.use('/produccion', produccion);
app.use("/produccionPeso", produccionPeso);
app.use("/produccionMortalidad", produccionMortalidad);
app.use("/produccionAlimento", produccionAlimento);
app.use("/produccionHuevos", produccionHuevos);
app.use("/produccionTraslado", produccionTraslado);
app.use("/produccionSemana", produccionSemana);
app.use("/poultry", poultry);
app.use("/cargos", cargos);
app.use("/produccionDespacho", produccionDespacho);
app.use("/nacimiento", nacimiento);
app.use("/nacimiento-reporte", nacimiento_reporte);
app.use("/periodo", periodo);
app.use("/periodoTareo", periodoTareo)
app.use("/periodoF33", periodoF33)
app.use("/costeo", costeo);
app.use("/DBCostsSG", DBCostsSG);
app.use("/enfermedades", enfermedades);
app.use("/standardSerologia", standardSerologia);
app.use("/vacunas", vacunas);
app.use("/distribuidoras", distribuidoras);
app.use("/laboratorios", laboratorios);
app.use("/resultados-serologia", resultadosSerologia)
app.use("/programa-vacunacion", programaVacunacion)
app.use("/depreciacion", depreciacion)
app.use("/variables-planta", variablesPlanta)
app.use("/Cartilla", Cartilla)
app.use("/Aviagen", Aviagen)
app.use("/Cierre", Cierre)
app.use('/CierreProd', cierreProd)
app.use('/tareo', tareo)
app.use('/tareo-consulta-detalle', tareoConsultaDetalle)
app.use('/ReporteProduccion', ReporteProduccion)
app.use('/clientes', clientes)
app.use("/cotizacion", cotizacionRouter)
app.use('/requerimiento', requerimiento)
app.use('/comprobantes', comprobantes)
app.use('/mortalidadDiaria', mortalidadDiaria)
app.use('/mortalidadDiariaF33', mortalidadDiariaF33)
app.use('/tipoDocumentoContabilidad', tipoDocumentoContabilidadRouter)
app.use('/prodLogs', prodLogsRoute)
app.use('/destinatarioCargas', destinatariosCargasRoute)
app.use('/provisionCts', provisionCtsRoute)
app.use("/provisionVacaciones", provisionVacacionesRoute)
app.use("/provisionGratificacion", provisionGratificacionRoute)
app.use("/granjaApertura", granjaSolicitudAperturaRoute)
app.use("/provisionCosteo", provisionCosteoRoute)
app.use("/provisionApertura", provisionAperturaRoute)
app.use("/fcProveedorTipoServicio", fcProveedorTipoServicio)
app.use("/fcTipoDoc", fcTipDocRoute)
app.use("/fcFlujoProyectado", fcFlujoProyectado)
app.use("/fcFlujoReal", fcFlujoReal)
app.use("/fcTipoAnexo", fcTipoAnexoRoute)
app.use("/alimentacionTarifa", alimentacionTarifaRoute)
app.use("/alimentacionRuta", alimentacionRutaRoute)
app.use("/alimentacionTarifaRuta", alimentacionTarifaRutaRoute)
app.use("/flujoCajaPlanilla", flujoCajaPlanillasRoute)
app.use("/alimentacionNucleoDetalle", alimentacionResponsableNucleoDetalle)
app.use("/flujoRealProyectado", flujoRealProyectadoRoute)
app.use("/flujoRealGraficos", flujoGraficosRoute)
app.use("/confirmacionRuta", confirmacionRutaRoute)
app.use("/produccionCartillaVirtual", produccionCartillaVirtualRouet)
app.use("/levanteCartillaVirtual", levanteCartillaVirtualRoute)
app.use("/estadistica", estadisticaRoute)
app.use("/alimentacionCosteo", alimentacionCosteoRoute)
app.use("/contabilidadProvisionPlanillaResumen", planillaMensualRoute)
app.use(express.static(path.join(__dirname, 'public')));

if (hostname == "SUPERGEN") {
    cron.schedule("59 23 * * 6", async () => {
        const fecha = moment().subtract(5, "days")
        const data = await logisticaConsultaModel.crearExcelDeUnaFechaAdelante(fecha.format("YYYY-MM-DD"))
        if (!data.success) {
            return;
        }
        const htmlBodyMail = `<p>En el presente cor
        
        reo, se adjuntan el reporte de ordenes de servicio con sus registros de las última semana. </p>`
        const files = [{
            filename: "reporte orden servicio.xlsx", content: fs.readFileSync(data.rutaCM)
        }]
        const destinatarios = await sendEmailModel.destinatariosPorTipo("ordenServicio")
        await sendEmailModel.sendEmail(" Reporte de Ordenes de Servicio " + fecha.add(5, "days").format("YYYY-MMMM-DD"), destinatarios.map(d => d.email), htmlBodyMail, '"Supergen SA" <infosupergen@gmail.com>', files)
    })


    cron.schedule("59 23 * * 1", async () => {
        const fecha = moment().subtract(60, "days").format("YYYY-MM-DD")
        const estadistica = await requerimientoModel.estadisticaRequerimientoFiltradoPorFechaMayores(fecha)
        const htmlTabla = `<table>
        <thead>
        <tr>
        <th style="border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">REQUERIEMIENTO</th>
        ${estadistica.estados.map((e) => `<th style="border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;">${e}</th>`).join().replace(/,/g, '')}
        </tr>
        </thead>
            <tbody>
            ${estadistica.data.map((d) => `<tr>
            <td style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">${d.nombre}</td>
            ${d.estadistica.map((e) => `<td style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;"> ${e.valor}%</td>`).join().replace(/,/g, '')
            }
            </tr>`).join().replace(/,/g, '')}   
            </tbody>        
        </table>`
        await sendEmailModel.sendEmail("Estadistica de requeriemientos a partir del " + fecha, ["tonygreys2008@gmail.com", "cibanezpe@gmail.com", "lbuttgenbach@supergen.net"], htmlTabla, '"Supergen SA" <infosupergen@gmail.com>')
    })
    cron.schedule("59 23 * * *", async () => {
        await produccionHuevosModel.getProduccionDiariaCron()
        await sendEmailModel.sendEmail(
            "produccion de huevos diarios con exito ",
            ["cibanezpe@gmail.com"],
            '<p>Se a generado la data de produccion de huevos diarios de los periodos abiertos </p>',
            '"Supergen SA" <infosupergen@gmail.com>'
        )
    })
    cron.schedule("59 23 * * *", async () => {
        sendEmailModel.doActivity()
        await mortalidadModelo.desactivarEstadosDePeriodosPasados()
    })
    //"* 59 23 * * 5" todos los sabados,
    //50 12 * * 7
    cron.schedule("0 23 * * *", async () => {
        //AQUI ES
        console.log("cron diario de mortalidad");
        var respuesta = await periodoF33Model.cronDiario();
        await sendEmailModel.sendEmail(
            "Reporte de mortalidad de periodos abiertos " + respuesta.periodos_ini + " - " + respuesta.periodos_ini,
            ["jorge.hospinal@yahoo.com", "cibanezpe@gmail.com"],
            //, "lbuttgenbach@supergen.net"],
            '<p>Se a generado el reporte de mortalidad diaria de los periodos abiertos ' + moment(respuesta.log.fechahora).format("DD-MM-YYYY hh:mm") + '</p>',
            '"Supergen SA" <infosupergen@gmail.com>'
        )

    })
    cron.schedule("59 30 6 * * *", async () => {
        console.log("cron diario 6:30am");
        await requerimientoModelo.calculoFechaEnvioCantidadEnviadaEstadoData()

    })
    cron.schedule("59 15 13 * * *", async () => {
        console.log("cron diario 1:15pm");
        await requerimientoModelo.calculoFechaEnvioCantidadEnviadaEstadoData()
    })

    cron.schedule("30 23 * * 6", async () => {
        //AQUI ES
        console.log('cron de requerimientos')

        let ccostos = ['granj', 'plant'];
        var html = "";
        html = html + `<p>
        Se a generado el reporte requerimientos mensuales
        </p><br>`;

        for (const iterator of ccostos) {
            let params = {
                fecha: moment().year(),
                unidadProductiva: iterator
            }
            html = html + `<p>Unidad productiva / ${iterator === "admin" ? 'Administracion' : iterator === "granj" ? 'Granja' : 'Planta'} :<p><br>`;

            var respuesta = await requerimientoModel.filtrarRequerimientoFechaYUnidadProductivaMensual(params);
            html = html + "<ul>";
            for (let index = 0; index < respuesta.length; index++) {
                const element = respuesta[index];
                html = html + `<li>Mes : ${element.mes} - ${Number(element.porcentajetotal).toFixed(2) * 100} %</li>`;
            }
            html = html + "</ul><br>";

            html = html + `<a href="http://portal.supergen.net/supergen-fe/#!/consulta-logistica-requerimiento-mensual">ver modulo de reportes mensuales</a>`;
        }

        var email = await sendEmailModel.sendEmail(
            "Reporte de requerimientos por unidad productiva ",
            ["lbuttgenbach@supergen.net", "cibanezpe@gmail.com"],
            html,
            '"Supergen SA" <infosupergen@gmail.com>'
        )
        console.log('cron de requerimientos', email);
    })

    cron.schedule("30 23 * * *", async () => {
        console.log('cron de alimentos nocturno');
        await alimentoModel.cronDiarioAlimento();

        var destinatarios = [];
        destinatarios = await tareoModel.getEmailsRrhh();
        destinatarios.push("cibanezpe@gmail.com");
        /*         destinatarios.push("jorge.hospinal@yahoo.com");
               */

        sendEmailModel.sendEmail(
            `Se estan generando los kardex de alimentos para los periodos abiertos`,
            destinatarios,
            `<strong>Se generan los kardex de alimentos para los periodos abiertos</strong>`,
            '"Supergen SA" <infosupergen@gmail.com>',
            []
        )
        //sendEmailModel.sendEmail(`Consulta semanal de asistencias de las fechas: ${fechaIni} al ${fechaFin}`, destinatarios, `<strong>Se filtran las asistencias detalladas de los empleados administrativos</strong>`, '"Supergen SA" <infosupergen@gmail.com>', [{ filename: "consulta detalle.xlsx", content: Buffer.from(bufferExcel) }])
    })


    cron.schedule("0 23 * * 6", async () => {
        const fechaIni = moment().subtract(5, "days").format("YYYY-MM-DD");
        const fechaFin = moment().add(1, "day").format("YYYY-MM-DD");
        const params = {
            fechaIni,
            fechaFin,
            departamento: { id: 2 },
            include_aditional: true
        }

        const totalDays = moment(fechaFin).diff(moment(fechaIni), 'd');
        const data = await tareoModel.tareoConsultaFiltrado(params)
        const dataFormat = tareoModel.formatDataInTableTareo(data)
        params.data = dataFormat;
        var destinatarios = [];
        destinatarios = await tareoModel.getEmailsRrhh();
        destinatarios.push("cibanezpe@gmail.com");
        destinatarios.push("jorge.hospinal@yahoo.com");
        destinatarios.push("ibuttgenbach@supergen.net");
        destinatarios.push("recursos_humanos@supergen.net");
        params.destinatarios = destinatarios;
        params.buffer = true;
        //console.log('parametrossss',params);
        //return
        //
        //const dataFormat = tareoModel.dataInFormatExcelTableConsultaDetallev2(data, fechaIni, totalDays);

        tareoModel.exportBufferExelConsultaDetall(params)

        //

        //sendEmailModel.sendEmail(`Consulta semanal de asistencias de las fechas: ${fechaIni} al ${fechaFin}`, destinatarios, `<strong>Se filtran las asistencias detalladas de los empleados administrativos</strong>`, '"Supergen SA" <infosupergen@gmail.com>', [{ filename: "consulta detalle.xlsx", content: Buffer.from(bufferExcel) }])
    })
    //59 59 23 * * 6
    //59 23 * * 6
    cron.schedule("59 23 * * 6", async () => {
        await sendEmailModel.sendWeekReport(poolPromise);
    });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(PORT, function () {
    console.log("app listening at http://localhost:" + PORT)
})
module.exports = app;

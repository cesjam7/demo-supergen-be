var express = require('express');
var router = express.Router();
var alimentos = require('../models/alimentos');
var mortalidad = require('../models/mortalidad');
let periodoF33 = require('../models/periodo_f33');
const auth = require('../middlewares/auth');
const { route } = require('./usuario');

router.get('/:id?', auth.isAuth, function (req, res, next) {

    console.log('todos', req.params)
    if (req.params.id > 0) {
        console.log('ruta', req.params.id)
        alimentos.getAlimentoById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }
        });
    } else {

        alimentos.getAllAlimento(function (err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }

        });
    }
});
router.post("/guardar/confirmacionAlimento", auth.isAuth, async (req, res) => {
    try {
        await alimentos.crearConfirmacionDeIngresos({ ...req.body, user: req.user })
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }

})

router.post("/exportarExcelConfirmacionIngresos", auth.isAuth, async (req, res) => {
    try {
        const rows = await alimentos.exportarExcelConfirmaconDeIngresos(req.body)
        res.send(rows)
    } catch (error) {
        res.status(500).send(error)
    }


})
router.post("/guardar/confirmacionAlimentoDespacho", auth.isAuth, async (req, res) => {
    try {
        await alimentos.crearConfirmacionIngresosDespacho({ ...req.body, user: req.user })
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/transferir/confirmacionAlimentoDespacho", auth.isAuth, async (req, res) => {
    try {
        await alimentos.transferirAlimentoDespacho({ ...req.body })
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error.message)
    }

})
router.post("/despacho/listar", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentos.listarConfirmacionIngresoDespacho(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }

})

router.post("/editar/cantidadConfirmada", auth.isAuth, async (req, res) => {
    try {
        await alimentos.updateCantidadConfirmada(req.body)
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error.message)

    }

})
router.post("/editar/cantidadConfirmadas", auth.isAuth, async (req, res) => {
    try {
        await alimentos.actualizarCantidadConfirmadaBatch(req.body)
        res.send({ message: "success" })
    } catch (error) {
        res.status(500).send(error.message)

    }

})

router.get("/despachoDetalle/listar/:nroSerie/:idGranja", async (req, res) => {
    try {
        const data = await alimentos.listarDetalleDespacho(req.params.nroSerie, req.params.idGranja)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }


})


router.get("/despacho/listarDespachosSinConfirmacion", async (req, res) => {
    try {
        const data = await alimentos.listarDespachosSinConfirmacion()
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/guardar/generarKardex", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentos.generarKardexAlimento({ ...req.body, user: req.user })
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get("/ultimoSeriePorGranja/:idGranja", async (req, res) => {
    try {
        const data = await alimentos.ultimoNroSeriePorGranja(req.params.idGranja)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.post("/lista/kardexPorLote", auth.isAuth, async (req, res) => {
    try {
        const data = await alimentos.listarKardexPorAlimentoPeriodoLoteYTipo({ ...req.body, tipo: req.body.tipo == "LEVANTE" ? "L" : "P" })
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/listar/kardex", auth.isAuth, async (req, res) => {

    try {
        const data = await alimentos.listarKardexFiltrado(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/listar/kardex", auth.isAuth, async (req, res) => {

    try {
        const data = await alimentos.listarKardex()
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get("/prueba/pruebaServicio", async (req, res) => {
    try {
        await alimentos.generarKardexAlimentoServicio()
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post('/', auth.isAuth, function (req, res, next) {

    alimentos.addAlimento(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        } else {
            res.json(req.body); //or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    alimentos.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    alimentos.deleteAlimentos(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    alimentos.updateAlimento(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.get('/levantes/', auth.isAuth, function (req, res, next) { // 
    alimentos.getAlimentoLevantes(function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
})
router.get('/levante/:id?', auth.isAuth, async function (req, res, next) { // auth.isAuth, 
    let rows = await alimentos.getAlimentoLevante(req.params.id);
    res.json(rows);
})
router.get('/semana/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await alimentos.getAlimentoSemana(req.params.id, req.query.type);
    res.json(rows);
})
router.post('/semanal/grupal/', auth.isAuth, async function (req, res, next) {
    let rows = await alimentos.postAlimentoSemana(req.body);
    res.json(rows);
})
router.get('/semana/standard/gramos/:idLinea/:semana', auth.isAuth, function (req, res) {
    alimentos.getStandardGramo(req.params, function (err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.get('/semana/standard/pesos/:idLinea/:semana', auth.isAuth, function (req, res) {
    alimentos.getStandardPeso(req.params, function (err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.get('/semana/:idLote/:semana', auth.isAuth, function (req, res, next) {
    alimentos.getStandard(req.params, function (err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.get('/alimentos/:id?', auth.isAuth, function (req, res, next) {
    alimentos.getAlimentoByIdLevante(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
})
router.post("/consultas/Alimentos", async (req, res, next) => {
    let rows = await alimentos.getAlimentos(req.body);
    console.log(req.body)
    res.json(rows);
})
router.get('/alimentos/crondiario', async (req, res, next) => {
    var respuesta = await alimentos.cronDiario();
    /*var email = await sendEmailModel.sendEmail(
        "Reporte de mortalidad de periodos abiertos " + respuesta.periodos_ini + " - " + respuesta.periodos_ini,
        ["jorge.hospinal@yahoo.com", "cibanezpe@gmail.com"],
        //, "lbuttgenbach@supergen.net"],
        '<p>Se a generado el reporte de mortalidad diaria de los periodos abiertos '+moment(respuesta.log.fechahora).format("DD-MM-YYYY hh:mm")+'</p>',
        '"Supergen SA" <infosupergen@gmail.com>'
    )
    respuesta.email = email;*/
    res.json(respuesta);
})
router.post("/export-excel/excel", auth.isAuth, async function (req, res, next) {
    const { data, lote } = req.body
    let rows = await alimentos.exportexcel(data, lote)
    if (rows.success == true) {
        rows.pathComplete = "/supergen-be" + rows.path;
        res.json(rows);
    } else {
        res.json({
            success: false,
            message: 'Ocurrio un error en el servidor'
        })

    }
})
router.get("/funcionalidad/cron", async (req, res) => {
    try {
        const data = await alimentos.cronDiarioAlimento();
        res.send(data)
    } catch (error) {
        res.status(500).send(error)
    }


})
module.exports = router;
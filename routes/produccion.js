var express = require('express');
var router = express.Router();
var produccion = require('../models/produccion');
const auth = require('../middlewares/auth')

router.get('/:id?', auth.isAuth, async function (req, res, next) {
    console.log("produccion")
    if (req.params.id == 'lotes') {
        let rows = await produccion.getLotesProduccion();
        res.json(rows);
    } else if (req.params.id == 'lotesAll') {
        let rows = await produccion.getAllLotesProduccion();
        res.json(rows);
    } else if (req.params.id == 'ultimo') {
        produccion.getUltimaProduccion(function (err, rows) {
            if (err) {
                res.json(err);
            } else {
                res.json(rows[0]);
            }
        });
    } else if (req.params.id == 'getLotesCompararProd') {
        let rows = await produccion.getLotesCompararProd();
        res.json(rows);
    } else if (req.params.id > 0) {
        let rows = await produccion.getProduccionById(req.params.id);
        res.json(rows);
    } else {
        produccion.getAllProduccion(function (err, rows) {
            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }
        })
    }
});
router.get("/listar/codigoHuevos", auth.isAuth, async (req, res) => {
    try {
        const data = await produccion.listarHuevosIncubables(req.body, req.user)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/actualizarLoteEstado", auth.isAuth, async (req, res) => {
    try {
        await produccion.actualizarEstadoLotes(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }

})

router.post("/actualizar/actualizarSeleccionEstado", auth.isAuth, async (req, res) => {
    try {
        await produccion.updateSeleccionReporte(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/huevosIncubables/listar", auth.isAuth, async (req, res) => {
    try {
        const data = await produccion.listarTransferenciaHuevos()
        res.send(data)
    } catch (error) {
        res.status(500).send(error);
    }

})
router.post("/huevosIncubables/transferencia", auth.isAuth, async (req, res) => {
    try {
        await produccion.transferenciaProduccionHuevos(req.body, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send(error);
    }
})
router.get("/huevosIncubables/:idProduccion/detalle", auth.isAuth, async (req, res) => {
    try {
        const detalle = await produccion.listarDetalleProduccionHuevo(req.params.idProduccion)
        res.send(detalle)
    } catch (error) {
        res.status(500).send(error);
    }
})
router.post("/consulta/huevosIncubables", auth.isAuth, async (req, res) => {
    try {
        const data = await produccion.listarProduccionHuevosPorIdProduccionYFecha(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error.message);
    }
})
router.get("/listarProduccion/agrupados-lotes", auth.isAuth, async (req, res) => {
    try {
        res.send(await produccion.listarLotesAgrupadosPorProduccion())
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/num_aves/:idLevante', auth.isAuth, async function (req, res, next) {
    let rows = await produccion.getNumAvesFinLevante(req.params);
    res.json(rows);
});
router.post('/', auth.isAuth, async function (req, res, next) {
    let rows = await produccion.addProduccion(req.body);
    res.json(req.body);
});
router.put('/lotes/:id', auth.isAuth, function (req, res, next) {
    produccion.updateProduccionLotes(req.params.id, req.body, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.post('/updateProd', auth.isAuth, async function (req, res, next) {
    let rows = await produccion.updateProd(req.body);
    res.json(rows);
});
router.get('/contable/get', async function (req, res, next) {
    console.log('asdsad');
    produccion.getProduccionCotable().then(result => {
        res.json(result);
    });
});

module.exports = router;

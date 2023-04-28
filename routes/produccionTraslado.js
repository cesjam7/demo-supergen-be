var express = require('express');
var router = express.Router();
var produccionTraslado = require('../models/produccionTraslado');
const auth = require('../middlewares/auth')

router.post("/ventasDetallado", auth.isAuth, async (req, res) => {
    try {
        const rows = await produccionTraslado.getVentasDetallado(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/exportarExcelVentas", auth.isAuth, async (req, res) => {
    try {
        const message = await produccionTraslado.exportarExcelVentas(req.body.params, req.body.rows)
        message.rutaCM = "/supergen-be" + message.rutaCM
        res.json(message)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.post("/ventasAgrupados", auth.isAuth, async (req, res) => {
    try {
        const rows = await produccionTraslado.getVentasAgrupado(req.body)
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    }

})
router.get('/:id?', auth.isAuth, async function (req, res, next) {
    if (req.params.id == 'lotes') {
        let rows = await produccionTraslado.getLotesProduccion();
        res.json(rows);
    } else if (req.params.id == 'ultimo') {
        produccionTraslado.getUltimaProduccion(function (err, rows) {
            if (err) {
                res.json(err);
            } else {
                res.json(rows[0]);
            }
        });
    } else if (req.params.id > 0) {
        let rows = await produccionTraslado.getProduccionTrasladoById(req.params.id);
        res.json(rows);
    } else {
        produccionTraslado.getAllProduccionTraslado(function (err, rows) {
            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }
        })
    }
});
router.get('/num_aves/:idLevante', auth.isAuth, function (req, res, next) {
    produccionTraslado.getNumAvesFinLevante(req.params, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.post('/', auth.isAuth, async function (req, res, next) {
    try {
        let count = await produccionTraslado.verifyProduccionMortalidad(req.body);
        if (count == true) {
            let rows = await produccionTraslado.addProduccionTraslado(req.body);
            let st = await produccionTraslado.StockAvesMensual(req.body, rows);
            res.json(req.body);
        } else {
            res.json({
                success: false,
                message: "Esta acción es inválida"
            })
        }
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

});
router.put('/lotes/:id', auth.isAuth, function (req, res, next) {
    produccionTraslado.updateProduccionLotes(req.params.id, req.body, function (err, rows) {
        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {
    let rows = await produccionTraslado.deleteProduccionTraslado(req.params.id);
    res.json(rows);
})

module.exports = router;

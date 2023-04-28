var express = require('express');
var router = express.Router();
var mortalidad = require('../models/mortalidad');
var levanteAlimento = require('../models/levanteAlimento');
const auth = require('../middlewares/auth')

router.get('/ultimo-dia/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getmortalidadUltimoDia(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})

router.post('/ultimo-dia', auth.isAuth, async function (req, res) {
    try {
        const ultimosDias = await mortalidad.getMortalidadUltimoDiaPorLevantes(req.body)
        res.send(ultimosDias)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/ultimo-dia/levantes", auth.isAuth, async (req, res) => {
    try {
        const levantes = await mortalidad.getMortalidadesPorLevantes(req.body)
        res.send(levantes)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/dia/:idlevante/:edad', auth.isAuth, function (req, res, next) {
    console.log('params', req.params);
    mortalidad.getmortalidadDia(req.params.idlevante, req.params.edad, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.get('/levantes/', auth.isAuth, function (req, res, next) {
    mortalidad.getMortalidadLevantes(function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.post("/mortalidad/PorPeriodo", async function (req, res) {
    const data = await mortalidad.costeoPorMesAnio(req.body)
    res.send(data)
})
router.get('/levante/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getMortalidadLevante(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/levante-moratilidad-cron', async function (req, res, next) {
    await mortalidad.desactivarEstadosDePeriodosPasados()
    res.send({ message: "exitoso" })
})
router.post('/lotesPorLevantes', auth.isAuth, async function (req, res) {
    try {
        const data = await mortalidad.getMortalidadPorLevantes(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send(error);

    }
})
router.get('/semana/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await mortalidad.getMortalidadSemana(req.params.id);
    res.json(rows);
})
router.get('/mortalidades/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getMortalidadByIdLevante(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/dias/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getmortalidadDia(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/edad-maximo/', auth.isAuth, function (req, res, next) {
    mortalidad.getEdadMaximo(function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.get('/edad/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getEdadEspecifica(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/dia-inicio/', auth.isAuth, function (req, res, next) {
    mortalidad.getDiaInicio(function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.get('/:id?', auth.isAuth, function (req, res, next) {

    if (req.params.id > 0) {

        mortalidad.getmortalidadById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else {

        mortalidad.getAllmortalidad(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }

        });
    }
});
router.post('/', auth.isAuth, function (req, res, next) {
    mortalidad.addMortalidad(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/modal/', auth.isAuth, async function (req, res, next) {
    let reta = await mortalidad.addMortalidadModal(req.body);
    await mortalidad.StockMensualAves(req.body, reta);
    await mortalidad.verifyVentas(req.body);
    res.json(req.body);
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    mortalidad.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    mortalidad.deletemortalidad(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rr = await mortalidad.updateMortalidad(req.params.id, req.body);
    let rr1 = await mortalidad.updateValores(req.body, rr);
    let rr2 = await mortalidad.updateAcumulado(req.body, rr1);
    let rr3 = await mortalidad.updateAcumulado2(req.body, rr2);
    let rr4 = await mortalidad.disparadorAlimentos(req.body, rr3);
    await mortalidad.StockMensualAves(req.body, rr4);
    await mortalidad.updateVentas(req.body);
    res.json(req.body);
});
module.exports = router;

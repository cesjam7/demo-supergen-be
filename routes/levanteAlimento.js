var express = require('express');
var router = express.Router();
var mortalidad = require('../models/levanteAlimento');
const auth = require('../middlewares/auth')
var mortalidad1 = require('../models/mortalidad');

router.get('/ultimo-dia/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getAlimentoUltimoDia(req.params.id, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})
router.post("/ultimo-dia", auth.isAuth, async function (req, res) {
    try {
        const alimentos = await mortalidad.getAlimentoPorLevantes(req.body)
        res.send(alimentos);
    } catch (error) {
        res.status(500).send(error);
    }

})
router.get('/dia/:idlevante/:edad/:idAlimento', auth.isAuth, function (req, res, next) {
    console.log('params', req.params);
    mortalidad.getAlimentoDia(req.params.idlevante, req.params.edad, req.params.idAlimento, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})

//Nuevo-----------------------------------------------------------------------------------
router.get('/ultimoDiaAlimento/:idlevante/:edad', auth.isAuth, function (req, res, next) {
    mortalidad.getCantidadDatosPorEdad(req.params.idlevante, req.params.edad, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})

router.get('/sumaTotalAlimento/:idlevante/:edad', auth.isAuth, function (req, res, next) {
    mortalidad.getSumaTotalAlimentos(req.params.idlevante, req.params.edad, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows[0]);
        }
    });
})

router.get('/alimentoCombo/', auth.isAuth, function (req, res, next) {
    mortalidad.getTipoAlimentoComboLevante(function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
//Nuevo--------------------------------------------------------------------------------
//CAMBIO--------------------------------------------------
router.get('/levantes/', auth.isAuth, function (req, res, next) {
    mortalidad.getAlimentoLevantes(function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
})
router.get('/levante/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await mortalidad.getAlimentoLevante(req.params.id);
    res.json(rows);
})
router.post('/lotesPorLevantes', auth.isAuth, async function (req, res) {
    try {

        let rows = await mortalidad.getLotesPorLevantes(req.body);
        res.json(rows)
    } catch (error) {
        res.status(500).send(error)
    };
})
router.get('/alimentos/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await mortalidad.getAlimentoByIdLevante(req.params.id);
    res.json(rows);
})
//CAMBIO----------------------------------------------------------
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
router.get('/STD/:idlote/:semana', auth.isAuth, function (req, res, next) {
    mortalidad.getPesoSTD(req.params.idlote, req.params.semana, function (err, rows) {

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

router.get('/tipoAlimentoId/:id?', auth.isAuth, function (req, res, next) {
    mortalidad.getTipoAlimentoById(req.params.id, function (err, rows) {

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
    let count = await mortalidad1.verifyMortalidadEdad(req.body);
    if (count.length == 0) {
        res.json({
            "message": "Primero registre Datos en Mortalidad",
            "success": false
        })
    } else {
        await mortalidad.addlevanteAlimentoModal(req.body);
        await mortalidad.addlevanteProcedureModal(req.body);
        await mortalidad.addlevanteProcedure2Modal(req.body);
        res.json(req.body)
    }
});
router.post('/:id', function (req, res, next) {
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

    let rows = await mortalidad.updatelevanteAlimento(req.params.id, req.body);
    let rows2 = await mortalidad.addlevanteProcedureModal(req.body);
    let rows3 = await mortalidad.updatelevanteAlimento2(req.params.id, req.body);
    res.json(rows3);
});
module.exports = router;

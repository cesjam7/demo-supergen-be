var express = require('express');
var router = express.Router();
var lotes = require('../models/lotes');
const auth = require('../middlewares/auth')

router.get('/:id?', function (req, res, next) {

    if (req.params.id == 'mortalidad') {

        lotes.getLoteMortalidad(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else if (req.params.id > 0) {

        lotes.getLoteById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else if (req.params.id == 'comparar') {

        lotes.getLotesComparar(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else if (req.params.id == 'compararProd') {

        lotes.getLotesCompararProd(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }
        });
    } else {

        lotes.getAllLotes(function (err, rows) {

            if (err) {
                res.json(err);
            }
            else {
                res.json(rows);
            }

        });
    }
});
router.get("/granja/granjaPorlevanteOProduccion1", auth.isAuth, async (req, res) => {
    try {
        const granja = await lotes.getGranjaPorProduccionOLevante1(req.query.idObjeto, req.query.tipo)
        res.send(granja)
    } catch (error) {
        res.status(500).send(error)
    }
})
router.get('/levantes/:id', auth.isAuth, async function (req, res, next) {
    let rows = await lotes.getAllLotesbyid(req.params.id);
    res.json(rows);
});
router.post("/levantes/lotes", auth.isAuth, async (req, res) => {
    try {
        const data = await lotes.getLotesPorLevantes(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.get('/semana/:id', function (req, res, next) { // auth.isAuth,
    lotes.getLoteSemanaIdLinea(req.params.id, function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});
router.post('/', auth.isAuth, function (req, res, next) {

    lotes.addLote(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        }
        else {
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/exist/', auth.isAuth, function (req, res, next) {

    lotes.existLote(req.body, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            if (count.length == 0) {
                res.json({
                    "success": true
                })
            } else {
                res.json({
                    "success": false
                })
            }//or return count for 1 & 0
        }
    });
});
router.post('/semana', auth.isAuth, function (req, res, next) {
    lotes.getLoteSemana(req.body, function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});
router.post('/semanaProd', auth.isAuth, async function (req, res, next) {
    let rows = await lotes.getLoteSemanaProd(req.body);
    res.json(rows);
});
router.post('/semana/pesos', auth.isAuth, function (req, res, next) {
    lotes.getLoteSemanaPesos(req.body, function (err, rows) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});

router.post('/:id', auth.isAuth, function (req, res, next) {
    lotes.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    lotes.deleteLote(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    lotes.updateLote(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });
});
module.exports = router;

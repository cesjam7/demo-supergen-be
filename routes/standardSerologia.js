var express = require('express');
var router = express.Router();
var standardSerologia = require('../models/standardSerologia');
const auth = require('../middlewares/auth')

router.get('/', async function (req, res, next) {
    let rows = await standardSerologia.getAllstandardSerologia();
    res.json(rows);
}); 

router.get('/standardSerologia/:id?', async function (req, res, next) {

    let rows2 = await standardSerologia.getStandardSerologiaById(req.params.id);
    res.json(rows2);
});
router.get('/stdSerologia/:id?', async function (req, res, next) {

    let rows2 = await standardSerologia.getStdSerologiaById(req.params.id);
    res.json(rows2);
});

router.post('/', auth.isAuth, async function (req, res, next) {
    let rows3 = await standardSerologia.addStandardSerologia(req.body);
    res.json(rows3);
})
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows4 = await standardSerologia.updateStandardSerologia(req.params.id, req.body);
    res.json(rows4);
});
router.delete('/:id', auth.isAuth, async function (req, res, next) {

    let rows5 = await standardSerologia.deleteStandardSerologia(req.params.id);
    res.json(rows5);
});
module.exports = router;
var express = require('express');
var router = express.Router();
var alimento = require('../models/produccionAlimento');
const auth = require('../middlewares/auth')
var mortalidad1 = require('../models/produccionMortalidad');

router.get('/grafico/:id', auth.isAuth,async function(req,res,next){
    let rows = await alimento.graficoAlimento(req.params.id);
    res.json(rows)
})

router.get('/ultimo-dia/:id?', auth.isAuth,function(req,res,next){
   alimento.getAlimentoUltimoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

router.get('/dia/:idproduccion/:edad/:idAlimento', auth.isAuth,function(req,res,next){
    console.log('params', req.params);
   alimento.getAlimentoDia(req.params.idproduccion, req.params.edad, req.params.idAlimento, function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

//Nuevo-----------------------------------------------------------------------------------
router.get('/ultimoDiaAlimento/:idproduccion/:edad', auth.isAuth,function(req,res,next){
   alimento.getCantidadDatosPorEdad(req.params.idproduccion, req.params.edad, function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

router.get('/sumaTotalAlimento/:idproduccion/:edad', auth.isAuth,function(req,res,next){
    alimento.getSumaTotalAlimentos(req.params.idproduccion, req.params.edad, function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows[0]);
         }
     });
 })

router.get('/alimentoCombo/', auth.isAuth,function(req,res,next){
    alimento.getTipoAlimentoComboProduccion(function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
 })
//Nuevo--------------------------------------------------------------------------------
//CAMBIO--------------------------------------------------
router.get('/producciones/', auth.isAuth,function(req,res,next){
   alimento.getAlimentoProducciones(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})

router.get('/produccion/:id?', auth.isAuth,async function(req,res,next){
    let rows = await alimento.getAlimentoProduccion(req.params.id);
    res.json(rows);
})

router.get('/produccion-levante/:id?', auth.isAuth,async function(req,res,next){
    let rows = await alimento.getProduccionesLevante(req.params.id);
    res.json(rows);
})

router.get('/alimentos/:id?', auth.isAuth,function(req,res,next){
   alimento.getAlimentoByIdProduccion(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
//CAMBIO----------------------------------------------------------
router.get('/dias/:id?', auth.isAuth,function(req,res,next){
   alimento.getalimentoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})

router.get('/STD/:idlote/:semana', auth.isAuth,function(req,res,next){
    alimento.getPesoSTD(req.params.idlote,req.params.semana,function(err,rows){

         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
})

router.get('/edad-maximo/', auth.isAuth,function(req,res,next){
   alimento.getEdadMaximo(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

router.get('/edad/:id?', auth.isAuth,function(req,res,next){
   alimento.getEdadEspecifica(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})

router.get('/dia-inicio/', auth.isAuth,function(req,res,next){
   alimento.getDiaInicio(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

router.get('/tipoAlimentoId/:id?', auth.isAuth,function(req,res,next){
    alimento.getTipoAlimentoById(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})

router.get('/:id?', auth.isAuth,function(req,res,next){

    if(req.params.id > 0){

        alimento.getalimentoById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else{

        alimento.getAllalimento(function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else
            {
                res.json(rows);
            }

        });
    }
});

router.post('/', auth.isAuth,function(req,res,next){
    alimento.addalimento(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});

router.post('/modal/', auth.isAuth,async function(req,res,next){
    let count = await mortalidad1.verifyMortalidadEdad(req.body);
    if(count.length == 0){
        res.json({
            "message":"Primero registre Datos en Mortalidad",
            "success": false
        })
    }else{
        await alimento.addProduccionAlimentoModal(req.body);
        await alimento.addProduccionProcedureModal(req.body);
        await alimento.addProduccionProcedure2Modal(req.body);
        res.json(req.body)
    }
});

// router.post('/:id',function(req,res,next){
//     alimento.deleteAll(req.body,function(err,count){
//         if(err)
//         {
//             res.json(err);
//         }
//         else
//         {
//             res.json(count);
//         }
//     });
// });

router.delete('/:id', auth.isAuth,function(req,res,next){

    alimento.deletealimento(req.params.id,function(err,count){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }

    });
});

router.put('/:id', auth.isAuth,async function(req,res,next){
    let rows = await alimento.updateProduccionAlimento(req.params.id,req.body);
    let rows1 = await alimento.addProduccionProcedureModal(req.body);
    let rows2 = await alimento.updateProduccionAlimento2(req.params.id,req.body);
    res.json(rows2);
});

router.post('/semana/grupal', auth.isAuth,async function(req,res,next){
    let rows = await alimento.postAlimentoSemana(req.body);
    res.json(rows);
})

router.get('/semana/:id?', auth.isAuth,async function(req,res,next){
    let rows = await alimento.getAlimentoSemana(req.params.id);
    res.json(rows);
})

router.get('/AveDiaGr/:id', auth.isAuth,async function(req,res,next){
    let rows = await alimento.AveDiaGr(req.params.id);
    res.json(rows)
})

router.post('/AveDiaGr/', auth.isAuth,async function(req,res,next){
    let rows = await alimento.updateAveDiaGr(req.body);
    res.json(rows)
})
module.exports=router;

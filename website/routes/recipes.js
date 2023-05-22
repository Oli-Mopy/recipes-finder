const express = require('express')
const md5 = require('md5')
const router = express.Router()
const Recipe = require('../models/recipe')
const User = require('../models/user')


//pre-select one recipe
async function getRecipe(req, res, next) {
    let recipe
    try{

        recipe = await Recipe.findById(req.params.id)
        if(recipe == null) {
            return res.status(404).json({ message: "Cannot find recipe"})
        }

    } catch (err){
        return res.status(500).json({message: err.message})
    }

    res.recipe = recipe
    next()
}

//pre-select possible ingredients to add (that are already in database)
async function getPossibleIngredients(req, res, next){

    let queryReq = await Recipe.find().select("ingredients.name -_id");  //get only ingredients without id of recipe

    let medium = [];
    queryReq.forEach(               //removing first layer of object
      function(o) {
         medium.push(o.ingredients);
      });
    
    medium = medium.flat(Infinity)      //removing arrays

    let ingredients = [];
    medium.forEach(                  //removing second layer of object
      function(o) {
         ingredients.push(o.name);
      });

    possibleIngredients = [...new Set(ingredients)];        //removing duplicates
    
    res.possibleIngredients = possibleIngredients
    next()
}


//show all recipes
router.get('/browse', async (req, res) => {
    try{

        const recipes = await Recipe.find().sort({dateOfCreation: 'desc'})  
        res.render('browse.ejs', { recipes: recipes })

    } catch(err){
        res.status(500).json({ message: err.message })
    }    
})

//show one recipe
router.get('/recipe/:id', getRecipe, async (req, res) => {
    res.render('show.ejs', {recipe: res.recipe}) 
})

//delete a recipe
router.delete('/:id', getRecipe, async (req, res) => {
    try{
        await res.recipe.remove()
        const recipes = await Recipe.find().sort({dateOfCreation: 'desc'})  
        res.status(200).render('adminpage.ejs', {recipes: recipes})

    } catch(err){
        res.status(500).json({message: err.message})
    }
})

//route to redirect to add-recipe view
router.get('/new', getPossibleIngredients, async (req, res) => {
    try{
        res.render('../views/newRecipe.ejs', {possibleIngredients: res.possibleIngredients})

    }catch(err){
        console.log(err)
    }

})

//add a recipe
router.post('/new', async (req, res) => {


    let recipe = new Recipe({
        title: req.body.title,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions
    })

    try{

        let newRecipe = await recipe.save()
        res.status(201).redirect(`/recipes/recipe/${recipe.id}`)

    }catch(err){
        res.status(400).json({ message: err.message })
    }

})

//route to redirect to home view
router.get('/home', getPossibleIngredients, async (req, res) => {
    try{
        res.render("index.ejs", {possibleIngredients: res.possibleIngredients});
    }
    catch(err)
    {
        console.log(err);
    }
})

//search for a matching recipe
router.post('/home', async (req, res) => {
    
    let ingredients = req.body.ingredients;

    let matches = [];
    let queryResponse;
    try{
        for (let i = 0; i < ingredients.length; i++) {
            queryResponse = await Recipe.find({ "ingredients.name": ingredients[`${i}`]});
            matches.push(queryResponse);
        }
        matches = matches.flat(Infinity);

        let result = {};
        for(var i = 0; i < matches.length; ++i) {
            if(!result[matches[i].title])              //counting the number occurences of each recipe, to know which ones contain more matching ingredients
                result[matches[i].title] = 0;
            ++result[matches[i].title];
        }
        
        result = Object.entries(result).sort((a,b) => b[1] - a[1]);  //sorting results to diplay them from best to worse

        let resultingRecipes = [];
        for (let i = 0; i < result.length; i++){
            const matchingRecipe = await Recipe.find({"title": result[i][0]}) 
            resultingRecipes.push(matchingRecipe);
        }
        resultingRecipes = resultingRecipes.flat(Infinity);

        res.render('searchResult.ejs', { recipes: resultingRecipes, NBmatchings: result })
    }
    catch(err){
        console.log(err)
    }
})

//show admin edit page
router.get('/edit/:id', getRecipe, getPossibleIngredients, async (req, res) => {
    try{
        res.render('editRecipe.ejs', {recipe: res.recipe, possibleIngredients: res.possibleIngredients}) 
    } catch(err){
        res.status(500).json({ message: err.message })
    }    
})

//modify and save a recipe
router.post('/edit/:id', getRecipe, async (req, res) => {
    if(req.body.title != null){
        res.recipe.title = req.body.title;
    }
    if(req.body.ingredients[0] != null && req.body.ingredients[1] != null){
        res.recipe.ingredients = req.body.ingredients;
    }
    if(req.body.instructions != null){
        res.recipe.instructions = req.body.instructions;
    }
    try{

        const modifiedRecipe = await res.recipe.save()
        const recipes = await Recipe.find().sort({dateOfCreation: 'desc'})  
        res.status(200).render('adminpage.ejs', {recipes: recipes})

    } catch(err){
        res.status(400).json({ message: err.message})
    }

})



//creating a new user
router.post('/newuser', async (req, res) => {
    
    try{
        if( req.body.permission == "granted" ){
            
            let user = new User({
                admin: req.body.admin,
                username: req.body.username,
                password: md5(req.body.password)
            })

            let newUser = await user.save();
            res.status(201).json(newUser);
        }

    }catch(err){
        res.status(403).json({ message: err.message })
    }
})

//showing the login page (only for admins for now)
router.get('/adminlogin', async (req, res) => {
    res.render('login.ejs')
})

//actual login
router.post('/adminlogin', async (req, res) => {

    //try to login by comparing with database values
    try{

        let username = req.body.username;
        let rawPassword = req.body.password;


        let queryRes = await User.findOne({"username": username});    

        if(md5(rawPassword) == queryRes.password){
            let recipes = await Recipe.find().sort({dateOfCreation: 'desc'})
            res.status(200).render("adminpage.ejs", {recipes: recipes});
        }
        else{
            res.status(403).json({message: "Wrong password."})
        }

    }catch(err){
        res.status(404).json({ message: "No such user." })
    }

})





module.exports = router

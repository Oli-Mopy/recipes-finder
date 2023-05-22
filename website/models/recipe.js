const mongoose = require('mongoose');


const ingredientAndQuantitySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        maxLength: 50
    },

    quantity: {
        type: String,
        required: true,
        maxLength: 25
    }
})

const recipeSchema = new mongoose.Schema({

    title:{
        type: String,
        required: true
    },

    instructions:{
        type: String,
        required: true
    },

    dateOfCreation:{
        type: Date,
        required: true,
        default: Date.now
    },

    ingredients: [ingredientAndQuantitySchema]
})


module.exports = mongoose.model('Recipe', recipeSchema)

const express = require('express')
const mongoose = require('mongoose')
const mongoSanitize = require('express-mongo-sanitize');
const methodoverride = require('method-override')

const app = express()

app.set("view engine", "ejs")
mongoose.connect('mongodb://localhost/recipes', {useNewUrlParser: true})
const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to Database"))


app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(mongoSanitize());
app.use(methodoverride('_method'));

const recipesRouter = require('./routes/recipes')
app.use('/recipes', recipesRouter)

app.listen(3000, () => console.log('Server Started'))

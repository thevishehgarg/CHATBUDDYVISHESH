require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const hbs = require("hbs");
const Register = require("./models/registers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("../src/middleware/auth");


require("./db/conn");

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partials_path);

app.get("/", (req,res) => {
    res.render("index");
});
app.get("/home", auth ,(req,res) => {
    res.render("home");
});

app.post("/", async (req,res) => {
    try {
        const password = req.body.Password;
        const Cpassword = req.body.ConfirmPassword;

        if (password === Cpassword) {
            const registerUser = new Register({
                Email : req.body.Email,
                Password : req.body.Password,
                ConfirmPassword: req.body.ConfirmPassword
            })
            const token = await registerUser.generateToken();

            res.cookie("jwt", token,{
                expires:new Date(Date.now() + 3153600000),
                httpOnly:true
            });

            
            const registered = await registerUser.save();
            res.status(201).render("index");
        }else{
            res.send("Passwords are not matching")
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/home", async (req, res)=>{
    try {
        const email = req.body.LoginEmail;
        const password = req.body.LoginPassword;

        const useremail = await Register.findOne({Email:email});
        const isMatch = await bcrypt.compare(password, useremail.Password);

        const token = await useremail.generateToken();

        res.cookie("jwt", token,{
            expires:new Date(Date.now() + 60000),
            httpOnly:true
        });

        if(isMatch){
            res.status(201).render("home")
        }else{
            res.send("invalid login details");
        }

    } catch (error) {
        res.status(400).send("invalid login details")
    }

})

app.listen(port,() => {
    console.log(`server is running at port ${port}`);
});
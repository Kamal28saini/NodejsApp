import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName : "Authentication",
}).then(c=>console.log("Database Connected")).catch(e=>console.log(e));

const app = express();

const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
});

const User = mongoose.model("User",userSchema);

// using middlewares
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

// setting up view engine
app.set("view engine","ejs");

// function same as router and it is work as middleware
const isAuthenticated = async (req,res,next)=>{
    const { token } = req.cookies;
    if(token){

        const decoded = jwt.verify(token,"asfsdfasfas");
        req.user = await User.findById(decoded._id);
        next();
    }
    else{
        res.redirect('login');
    }
};

//---------------get requests which render------------------------

// router for index.ejs file // index url
app.get("/",isAuthenticated,(req,res)=>{
    res.render('logout',{name:req.user.name});    
})

// for login
app.get("/login",(req,res)=>{
    res.render('login');
})

// Register
app.get("/register",(req,res)=>{
    res.render("register");    
})


//---------------post requests which redirect------------------------

app.post("/login",async(req,res)=>{
    const {email,password} = req.body;

    let user = await User.findOne({email});
    if(!user) return res.redirect("register");

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.render('login',{email,message:"Incorrect password"});

     // json web token parser 
     const token = jwt.sign({_id:user._id},"asfsdfasfas");

     res.cookie('token',token,{
         httpOnly:true,
         // time in mili seconds
         expires: new Date(Date.now()+60*100)
     });
     res.redirect("/");    
})

// for login
app.post('/register',async (req,res)=>{
    
    const { name , email , password } = req.body;  

    let user = await User.findOne({email});
    if(user){
        return res.redirect("login");
    }

    const hashedPassword = await bcrypt.hash(password,10)
    user = await User.create({
        name,
        email,
        password:hashedPassword,
    });

    // json web token parser 
    const token = jwt.sign({_id:user._id},"asfsdfasfas");

    res.cookie('token',token,{
        httpOnly:true,
        // time in mili seconds
        expires: new Date(Date.now()+60*100)
    });
    res.redirect("/");    
})


// for logout
app.get('/logout',(req,res)=>{
    res.cookie('token','null',{
        httpOnly:true,
        // time in mili seconds
        expires: new Date(Date.now())
    });
    res.redirect("/");    
})


app.listen(5000,()=>{
    console.log("Server is working")
})
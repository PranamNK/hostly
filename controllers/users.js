const User = require("../models/user");

module.exports.renderSignUpForm =  (req, res) =>{
    res.render("users/signup.ejs");
};

module.exports.signup = async(req,res, next) =>{
        try{
            let { username, email, password} = req.body;
            const newUser = new User({email, username});
            const registeredUser = await  User.register(newUser, password);
            console.log(registeredUser);
            req.login(registeredUser, (err) =>{
                if(err) {
                    return next(err);
                }
            req.flash("success", "welcome to Hostly!")
            res.redirect(req.session.redirectUrl || "/listings");
        });
        }catch(e){
            req.flash("error", e.message);
            res.redirect("/signup");
        }
};

module.exports.renderLogInForm = (req, res) =>{
    res.render("users/login.ejs");
};

module.exports.logIn = (req, res) =>{
    req.flash("success","Your Login was successful! Welcome to Hostly!");
    res.redirect(res.locals.redirectUrl || "/listings");
};

module.exports.logOut = (req, res, next) =>{
    req.logout((err) =>{
      if(err) {
      return  next(err);
      }  
      req.flash("success", "you are logged out!");
      res.redirect("/listings");
    });
};
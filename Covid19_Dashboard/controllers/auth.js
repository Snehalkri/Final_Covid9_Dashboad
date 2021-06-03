const  mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('express');
const nodemailer = require('nodemailer');
const  db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
  });
 
exports.register = (req,res)=>{
    const {name, email, password , cpassword} = req.body;

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
   await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "covid19@gmail.com", // generated ethereal user
      pass: "abc", // generated ethereal password
    },
  });

  // send mail with defined transport object
    await transporter.sendMail({
    from: '"Team Infinity" <covid19static@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "Successfully Registered.", // Subject line
    text: "Thank you for reaching us you are successfully registered.", // plain text body
    html: "<b>Thank you for reaching us! You are successfully registered.</b>", // html body
  });

}
    db.query("SELECT * FROM users WHERE email = ?",[email] ,async (error,result)=>{
        if(error) throw error;
        if(result.length > 0){
            return res.render('register.hbs' ,{
                message:'That email is already in use'
            });
        }else if(password !== cpassword){
            return res.render('register.hbs' , {
                message:'Password does not match!'
            });
        }

        let hashedPassword = await bcrypt.hash(password , 8);
        console.log(hashedPassword);

        db.query("INSERT INTO users SET ? " , {name:name , email:email , password : hashedPassword} , (errr,result)=>{
            if(errr){
                console.log(errr);
            }else{
                console.log(result);
                // req.session.userId = req.body.email
                req.session.userId = req.body.email;
                main().catch(console.error);
                return res.redirect('/home');   
            }
        })
    })
}

exports.login = async (req,res) =>{
    try{
        const {email , password} = req.body;
        if(!email || !password){
            return res.status(400).render('login.hbs' , {
                message:'Please provide an email and password!'
            })
        }
            db.query("SELECT * FROM users WHERE email = ?" , [email],async (err,result)=>{
                if(result.length === 0){
                    return res.status(404).render('login.hbs' , {
                        message:'User not found'
                    })
                }
                if(!result || !(await bcrypt.compare(password , result[0].password))){
                    return res.status(401).render('login.hbs' , {
                        message:'Email or Password incorrect'
                    });
                }
                else{
                    const id = result[0].email ;
                    console.log(id);
                    req.session.userId = id;
                    console.log(req.session.userId);
                    if(req.session.userId){
                        res.status(200).redirect('/home')
                    }else{
                        res.redirect('/login')
                    }
                }
            })
        
    }catch(err){
        console.log(err);
    }
  
}

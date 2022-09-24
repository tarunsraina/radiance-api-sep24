import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import jwt  from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config()
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

const PORT = process.env.PORT || 4000;
let refreshTokens = []

app.get('/',async(req,res)=>{
    res.send('Server up and running...')
})


//login api
app.post('/login',(req,res)=>{
    let status1;
    console.log(req.body.username);
    console.log(req.body.password);
    if(req.body.username===undefined || req.body.password===undefined){
        console.log("Request body is undefined!!!!!!")
        status1 = 400;
    }

    let user = {
        username : req.body.username,
        password : req.body.password
    }


   fetch('https://immense-elk-72.hasura.app/api/rest/login',{
        method : 'POST',
        body : JSON.stringify(user),
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret
        }
    }).then(res => Promise.all([res.status, res.text()]))
    .then(([status, textData]) => {
        if(textData.includes("[]" || status1==400)){
            res.status(401).send("No user found")
        }else if(textData.includes("FATAL") || textData.includes("failed")){
            res.status(500).send("Internal server error");
        }else{
        const accessToken = generateAccessToken(textData)
        const refreshToken = jwt.sign(textData, process.env.REFRESH_TOKEN)
        refreshTokens.push(refreshToken);
        //res.sendStatus(200);
        return res.json({
            accessToken,refreshToken
          })
        }
      })
})



// to add a new user
app.post('/add-user',async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/add-user';

    let user = {
        username : req.body.username,
        password : req.body.password
    }

    const options = {
        method : 'POST',
        body : JSON.stringify(user),
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret
        }
    }

    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)
})


// getting users
app.get('/users',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/users';
    console.log(req.user.data);
    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }
    const options = {
        method : 'GET',
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'X-Hasura-Role':'user',
            'X-Hasura-User-Id':`${user_id}`
        }
    }


    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)

})


// to get devices
app.get('/devices',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/devices';
    console.log(req.user.data);
    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }
    const options = {
        method : 'GET',
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'X-Hasura-Role':'user','X-Hasura-User-Id':`${user_id}`
        }
    }


    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)

})



// to add a device
app.post('/add-device',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/add-device';

    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }

    let device = {
        object : {
        battery_percentage : req.body.battery_percentage,
        user_id : user_id,
        device_name : req.body.device_name,
        led_blink_intensity : req.body.led_blink_intensity,
        vibration_intensity : req.body.vibration_intensity,
        device_version : req.body.device_version,
        firmware_version : req.body.firmware_version
        }
    }

    const options = {
        method : 'POST',
        body : JSON.stringify(device),
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret
        }
    }

    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))
    res.json(response)

})

// updating device
app.post('/update-device',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/update-device';

    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }

    let deviceInfo = {

        device_name : req.body.device_name,

        changes: {
            device_name : req.body.changes.device_name,
            battery_percentage : req.body.changes.battery_percentage,
            device_version : req.body.changes.device_version,
            firmware_version : req.body.changes.firmware_version,
            led_blink_intensity : req.body.changes.led_blink_intensity,
            vibration_intensity : req.body.changes.vibration_intensity
        }
    }


    const options = {
        method : 'PATCH',
        body : JSON.stringify(deviceInfo),
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'X-Hasura-Role':'user',
            'X-Hasura-User-Id':user_id
        }
    }

    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)

})

//to delete a device
app.delete('/delete-device',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/delete-device';

    let deviceInfo = {
        device_name : req.body.device_name
    }

    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }

    const options = {

        method : 'DELETE',
        body : JSON.stringify(deviceInfo),
        headers : { 
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'X-Hasura-Role':'user',
            'X-Hasura-User-Id':`${user_id}`
        }
    }

    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response);
})


// to add a cycle
app.post('/add-cycle',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/add-cycle';

    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }

    let cycle = {

        object : {
                start_time: req.body.start_time,
                end_time: req.body.end_time ,
                user_id : user_id,
                device_id : req.body.device_id,
                heating_mode: req.body.heating_mode,
                puffs_taken : req.body.puffs_taken
        }
    }

    const options = {
        method : 'POST',
        body : JSON.stringify(cycle),
        headers : {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'x-hasura-role':'user',
            'x-hasura-user-id': user_id
        }
    }

    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)
})


//to get cycle

app.get('/cycles',authenticateToken,async(req,res)=>{

    const URL = 'https://immense-elk-72.hasura.app/api/rest/cycles';

    let user_id;
    try{
        let data = String(req.user.data);
        let userIdData = data.split('user_id')[1];
        user_id = userIdData.substring(3,userIdData.length-4);
        console.log("user_id=",user_id);
    }catch(err){
        res.status(500).send("Internal Error, please login again");
        return;
    }

    const options = {
        method : 'GET',
        headers : {
            'content-type':'application/json',
            'x-hasura-admin-secret':process.env.x_hasura_admin_secret,
            'x-hasura-role':'user',
            'x-hasura-user-id':user_id
        }
    }



    const response = await fetch(URL,options)

    .then(res=>res.json())
    .catch(err=>res.status(500).send(err))

    res.json(response)

})




// middleware function to authenticate a token

function authenticateToken(req, res, next) {
   
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token,process.env.ACCESS_TOKEN, (err, user) => {
      console.log("error="+err)
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
}
    
  

function generateAccessToken(data) {
    return jwt.sign({data}, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
}

// api to generate a new token if token is expired using a refresh token
app.post('/token',(req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      if (err) return res.sendStatus(403)
      const accessToken = generateAccessToken({ user })
      res.json({ accessToken: accessToken })
    })
  })

// logout api

app.post('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

app.listen(PORT,()=>console.log('server up and running..'))

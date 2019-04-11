var User = require('../model/user');
var service = require('../model/service');
var servicerequest = require('../model/serviceRequest');
var bcrypt = require('bcryptjs');
var commanFunction = require("../module/commanFunctions")
var comment = require("../model/comment")
var nodeMailer = require('nodemailer');

exports.register = (req, res, next) => {
    if ((!req.body.password)) {
        res.send(commanFunction.apiResponse("Passsword field required", 200));
    }
    var addQuestion = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        type: req.body.type,
        token: ''

    });

    User(addQuestion).save()
        .then(result => {

            var transport = nodeMailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'trivediaum0013@gmail.com',
                    pass: 'aum@trivedi'
                }
            });
            var mailOptions = {
                from: req.body.email,
                to: req.body.email,
                subject: req.body.name,
                text: 'You have a submission from... Name: ' + req.body.name + ' Email: ' + req.body.email + ' Message: ' + req.body.type,
                html: '<p>You have a submission from...</p> <ul><li>Name: ' + req.body.name + '</li><li> Email: ' + req.body.email + '</li></ul>'

            }
            transport.sendMail(mailOptions, function (err, info) {
                if (err) {
                    return res.send(commanFunction.apiResponse(err, "Got error", 200));
                }
                res.send(commanFunction.apiResponse(result, "User successfully registered", 200));
            })
        }).catch((error) => {
            res.send(error);

        });
}


exports.login = (req, res, next) => {
    var arr = [];
    User.findOne({ email: req.body.email }).then(result => {

        if ((!result) || (!req.body.password)) {
            res.send(commanFunction.apiResponse("All field must be required", 200));
        }
        else {
            var passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
            if (!passwordIsValid) {
                res.send(commanFunction.apiResponse("Password not correct", 200));
            }
            else {
                var tokenGenerator = Math.random().toString(36).replace('0.', '');

                User.findOneAndUpdate({ email: req.body.email }, { $set: { 'token': tokenGenerator } })
                    .then(result => {

                        User.findOne({ token: tokenGenerator }, { password: 0 }).then(result => {

                            arr.push(result);
                            if (result.type == "serviceprovider") {
                                service.find({ serviceProviderId: result._id }, { _id: 1 },
                                    async function (err, result) {
                                        await servicerequest.find({ serviceId: result }).populate("serviceId").populate("customerId").then(data => {
                                            arr.push(data)
                                        })
                                        await res.send(commanFunction.apiResponse(arr, "Serviceprovider successfully login", 200));

                                    })
                            }

                            else if (result.type == "user") {

                                servicerequest.find({ customerId: result._id }).populate("serviceId").then(result => {
                                    if (result.length > 0) {

                                        arr.push(result)
                                        res.send(commanFunction.apiResponse(arr, "User successfully login", 200))
                                    }
                                    else {
                                        res.send(commanFunction.apiResponse(arr, "User successfully login", 200))
                                    }
                                })
                            }
                            else {
                                res.send(commanFunction.apiResponse("Sorry,please specify your user type", 200))
                            }
                        })
                    })
            }
        }
    });

}


exports.updateUserInfo = (req, res, next) => {

    var token = req.headers['x-access-token'];

    if (!token) {
        res.send(commanFunction.apiResponse("Authentication token required", 200));
    }
    if ((req.body.oldpassword && !req.body.newpassword) || (req.body.newpassword && !req.body.oldpassword)) {

        res.send(commanFunction.apiResponse("User oldpasswod and newpassword compulsory", 200));

    }
    if (!req.body.email && !req.body.name && !req.body.newpassword && !req.body.oldpassword) {
        res.send(commanFunction.apiResponse("Sorry you not update anything", 200));
    }
    // if (req.body.oldpassword == req.body.newpassword) {
    //     res.send(commanFunction.apiResponse("Both password are same", 200));
    // }
    else {

        commanFunction.verifyToken(token, function (responseuser) {

            let edit_temp_obj = {
                updateOne: {
                    filter: { token: token },
                    update: {
                        $set:
                        {

                        }
                    }
                }
            };
            console.log(responseuser);
            let data = [];

            if (!responseuser) {
                res.send(commanFunction.apiResponse("Authentication token not valid", 200));
            }
            else {

                var flag = true;
                User.find({ 'email': req.body.email })
                    .then(result => {
                        if (result.length > 0) {
                            flag = false;
                        }
                        else {
                            flag = true;
                        }
                    });

                if (req.body.email) {
                    edit_temp_obj.updateOne.update.$set.email = req.body.email;
                    data.push(edit_temp_obj)
                }
                if (req.body.name) {
                    edit_temp_obj.updateOne.update.$set.name = req.body.name;
                    data.push(edit_temp_obj)
                }
                if (req.body.oldpassword && req.body.newpassword) {

                    var stored_hash = responseuser.password;
                    var passwordflag = bcrypt.compareSync(req.body.oldpassword, stored_hash);

                    if (passwordflag) {
                        edit_temp_obj.updateOne.update.$set.password = bcrypt.hashSync(req.body.newpassword, 8);
                        data.push(edit_temp_obj)
                    }
                    else {

                        flag = false;
                    }

                }
                if (flag) {
                    User.bulkWrite(data, function (error_response, edit_response) {
                        if (error_response) {
                            console.log(error_response)
                            //res.send(commanFunction.apiResponse(error_response, "Error", 200));
                        }
                        else {
                            res.send(commanFunction.apiResponse(responseuser, "User data successfully updated", 200));
                        }

                    })

                }
                else {
                    res.send(commanFunction.apiResponse("User oldpassword and newpassword are same/ User enter proper oldpassword / Email address already exist", 200));
                }
            }
        })
    }
}


exports.logout = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.send(commanFunction.apiResponse("Authentication token required", 200));
    }
    else {
        commanFunction.verifyToken(token, function (result) {

            if (!result) {

                res.send(commanFunction.apiResponse("Sorry ,token not verify. try again..", 200));
            }
            else if (result.length > 0) {
                User.findOneAndUpdate({ token: token }, {
                    $set: {
                        token: ""
                    }
                }).then(result => {
                    res.send(commanFunction.apiResponse("User successfully logout", 200));
                })
            }
            else {
                res.send(commanFunction.apiResponse("User token not valid for logout", 200));
            }
        });
    }

}


exports.deleteUser = (req, res, next) => {
    var token = req.headers["x-access-token"];
    if (!token) {
        res.send(commanFunction.apiResponse("Authentication token required", 200));
    }
    commanFunction.verifyToken(token, function (userresult) {

        service.find({ serviceProviderId: userresult._id }, { _id: 1 }).then(serviceResponse => {

            servicerequest.find({ serviceId: serviceResponse, status: "accept" }).then(result => {
                if (result.length > 0) {
                    res.send(commanFunction.apiResponse("Sorry, user servicerequest in accept state", 200));
                }
                else {

                    servicerequest.find({ serviceId: serviceResponse }, { _id: 1 }).then(result => {
                        console.log("resultresultresult", result);
                         
                        comment.find({ userId: userresult._id }).then(result => {
                            comment.remove({ userId: { $in: userresult._id } }).then(result => {
                                servicerequest.deleteMany({ serviceId: { $in: serviceResponse } }).then(result => {
                                    service.deleteMany({ serviceProviderId: { $in: userresult._id } }).then(result => {
                                        User.findOneAndRemove({ _id: { $in: userresult._id } }).then(result => {
                                            res.send(commanFunction.apiResponse(result, "User data deleted succesfully", 200));
                                        })
                                    })
                                });

                            });
                        })
                            .catch(err => {
                                res.send(commanFunction.apiResponse(err, "Error", 200));
                            });
                    });
                }

            })

        });

    });
}




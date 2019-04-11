var User = require('../model/user');
var service = require('../model/service');
var serviceRequest = require('../model/serviceRequest');
var comment = require('../model/comment');
var commanFunction = require('../module/commanFunctions');

exports.createRequest = (req, res, next) => {
    var token = req.headers["x-access-token"];
    if (!token) {
        res.send(commanFunction.apiResponse("Authentication token required", 200));
    }
    else if ((!req.body.serviceId) || (!req.body.description)) {
        res.send(commanFunction.apiResponse("All field must be required", 200));
    }
    else {
        commanFunction.verifyToken(token, function (result) {
            console.log(result)
            if (!result) {
                res.send(commanFunction.apiResponse("Authentication token not exist", 200));
            }
            else if (result.type == "user") {
                var details = {
                    customerId: result._id,
                    serviceId: req.body.serviceId,
                    status: "pending",
                    description: req.body.description
                }
                serviceRequest(details).save().then(result => {
                    res.send(commanFunction.apiResponse(result, "User successfully created him/her request", 200));
                })
            }
            else {
                res.send(commanFunction.apiResponse("Create request only by user / Token not exist", 200));
            }
        })
    }
}

exports.deleteRequest = (req, res, next) => {
    var token = req.headers["x-access-token"];
    commanFunction.verifyToken(token, function (result) {
        console.log(result);
        if (!token) {
            res.send(commanFunction.apiResponse("Authentication token required", 200));
        }
        else if (!req.body.id) {
            res.send(commanFunction.apiResponse("All field required", 200));
        }
        if (!result) {
            res.send(commanFunction.apiResponse("User entered authentication token not valid", 200));
        }
        else if (result.type == "user") {
            serviceRequest.findOne({ _id: req.body.id }).populate("serviceId")
                .then(data => {
                    if (result._id.equals(data.customerId)) {
                        if (data.status == "accept") {

                            res.send(commanFunction.apiResponse("Sorry, your servicrequest in accepet state", 200));
                        }
                        else {
                            serviceRequest.findOneAndRemove({ _id: req.body.id })
                                .then(result => {
                                    comment.remove({ serviceRequestId: req.body.id })
                                        .then(result => {
                                            res.send(commanFunction.apiResponse("User servicerequest successfully deleted", 200));
                                        })
                                })
                        }
                    }
                    else {
                        res.send(commanFunction.apiResponse("User entered token not valid for this servicerequest", 200));
                    }
                })
        }
        else if (result.type == "serviceprovider") {
            serviceRequest.findOne({ _id: req.body.id }).populate("serviceId")
                .then(data => {
                    console.log(data)
                    if (result._id.equals(data.serviceId.serviceProviderId)) {
                        console.log(data);
                        if (data.status == "accept") {

                            res.send(commanFunction.apiResponse("Sorry, your servicerequest in accept state", 200))
                        }
                        else {
                            serviceRequest.findOneAndRemove({ _id: req.body.id })
                                .then(result => {
                                    comment.remove({ serviceRequestId: req.body.id })
                                        .then(result => {
                                            res.send(commanFunction.apiResponse("User servicerequest successfully deleted", 200));
                                        })
                                })
                        }
                    }
                    else {
                        res.send(commanFunction.apiResponse("User entered token not valid for this servicerequest", 200));
                    }
                })
        }

    })
}

exports.getallServiceRequest = (req, res, next) => {
    var token = req.headers["x-access-token"];
    var arr = [];

    if (!token) {
        res.send(commanFunction.apiResponse("User entered authentication token not valid", 200));
    }
    commanFunction.verifyToken(token, function (result) {

        arr.push(result);
        if (!req.body.status) {
            service.find({ serviceProviderId: result._id }, { _id: 1 },
                async function (err, result) {

                    await serviceRequest.find({ serviceId: result }).populate("serviceId").then(data => {
                        arr.push(data);
                    })
                    await res.send(commanFunction.apiResponse(arr, "Get all user servicerequest ", 200))
                })
        }
        else {
            service.find({ serviceProviderId: result._id }, { _id: 1 },
                async function (err, result) {
                    await serviceRequest.find({ serviceId: result, status: req.body.status }).populate("serviceId").then(data => {

                        arr.push(data);
                    })
                    await res.send(commanFunction.apiResponse(arr, "Get all user servicerequest", 200))
                })
        }
    })
}
var Service = require('../model/service');
var commanFunction = require('../module/commanFunctions');
var servicerequest = require('../model/serviceRequest');
var service = require('../model/service');


exports.addService = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.send(commanFunction.apiResponse("User authentication token required", 200));
    }
    commanFunction.verifyToken(token, function (result) {
        if (!result) {
            res.send(commanFunction.apiResponse("User token not valid", 200));
        }
        else if (!req.body.servicename) {
            res.send(commanFunction.apiResponse("All field required", 200));
        }
        else if (result.type == "serviceprovider") {
            var addService = new Service({
                servicename: req.body.servicename,
                serviceProviderId: result._id
            });
            Service(addService).save().then(result => {
                res.send(commanFunction.apiResponse(result, "Service Inserted", 200));
            });
        }
        else {
            res.send(commanFunction.apiResponse("Services only add by serviceprovider", 200));
        }
    })
}

exports.updateService = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.send(commanFunction.apiResponse("User authentication token required", 200));
    }
    commanFunction.verifyToken(token, function (result) {

        if (!result) {
            res.send(commanFunction.apiResponse("Services only edit by serviceprovider", 200));
        }
        else if ((!req.body.id) || (!req.body.servicename)) {
            res.send(commanFunction.apiResponse("All field required", 200));
        }
        else if (result.type == "serviceprovider") {

            service.findOne({ _id: req.body.id }).populate("serviceProviderId").then(element1 => {

                if (result._id.equals(element1.serviceProviderId._id)) {
                    Service.findOneAndUpdate({ _id: req.body.id }, {
                        $set: {
                            servicename: req.body.servicename
                        }
                    }).then(result => {
                        res.send(commanFunction.apiResponse(result, "Serviceprovider services sucessfully updated ", 200));
                    })
                }
                else {
                    res.send(commanFunction.apiResponse("User entered token not valid for update this servicerequest", 200));
                }
            })
        }
        else {
            res.send(commanFunction.apiResponse("Services only edit by serviceprovider", 200));
        }

    })
}

exports.deleteService = (req, res, next) => {

    var token = req.headers['x-access-token'];
    if (!token) {
        res.send(commanFunction.apiResponse("Authentication token required", 200));
    }
    commanFunction.verifyToken(token, function (result) {

        if (!result) {
            res.send(commanFunction.apiResponse("Services only delete by serviceprovider", 200));
        }
        else if (!req.body.id) {
            res.send(commanFunction.apiResponse("All field required", 200));
        }
        else if (result.type == "serviceprovider") {
            service.findOne({ _id: req.body.id }).populate("serviceProviderId").then(element1 => {
                if (result._id.equals(element1.serviceProviderId._id)) {
                    var a = [];
                    flag = true;
                    service.find({ serviceProviderId: result._id }, { _id: 1 }).then(async result => {
                        await servicerequest.find({ serviceId: result, status: "accept" }).then(result => {
                            if (result.length > 0) {
                                flag = false;
                            }
                        });
                        console.log(flag);
                        if (flag) {
                            service.findOneAndRemove({ _id: req.body.id }).then(result => {

                                servicerequest.remove({ serviceId: result._id }).then(result => {

                                    res.send(commanFunction.apiResponse("Services successfully remove there services ", 200));
                                })

                            })
                        }
                        else {
                            res.send(commanFunction.apiResponse("Sorry, You servicerequest in accept state", 200));
                        }
                    });
                }
                else {
                    res.send(commanFunction.apiResponse("User entered token not valid for update this servicerequest", 200));
                }
            });
        }
        else {
            res.send(commanFunction.apiResponse("Services only delete by serviceprovider", 200));
        }

    })
}

exports.showServices = (req, res, next) => {

    Service.find().then(result => {

        if (result.length > 0) {
            res.send(commanFunction.apiResponse(result, "List of services", 200));
        }
        else {
            res.send(commanFunction.apiResponse("No services exist", 200));
        }
    })
}

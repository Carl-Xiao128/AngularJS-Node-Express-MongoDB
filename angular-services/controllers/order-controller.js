const Order = require("../models/order-model").orderModel;
const User = require("../models/user-model").userModel;
const mongoose = require("mongoose");
const { createReceipt } = require("../util/receipt");
const ResponseApi = require("../models/response");

// exports.createOrder = (req, res, next) => {
//     Order.create(req.body)
//         .then(result => {
//             createReceipt(result, "orderReceipt.pdf");
//             User.updateOne({ _id: mongoose.Types.ObjectId(req.params.buyerId) },
//                 { $set: { cart: [] } ,  $inc:{ point: 100}}, {upsert: true} )
//                 .then(result => {
//                     res.status(200).send(result);
//                 })
//         })
//         .catch(err => {
//             res.status(500).send({ errMsg: err });
//         });
// };
exports.createOrder = (req, res, next) => {
    console.log(req.body);
    Order.create(req.body).then(result => {
        createReceipt(result, "orderReceipt.pdf");
        User.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.buyerId) },
            { $set: { cart: [] }, $inc: { point: 100 } },
            { upsert: true }
        ).then(result => {
            res.status(200).send(result);
        });
    });
};

exports.getById = (req, res, next) => {
    Order.findById(req.params.orderId)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(500).send({ errMsg: err });
        });
};

exports.list = (req, res, next) => {
    Order.find({ "user.userId": mongoose.Types.ObjectId(req.params.buyerId) }, {})
        .then(result => {
            res.status(200).send(new ResponseApi(200, "success", result));
        })
        .catch(err => {
            res.status(500).send(new ResponseApi(500, "error", err));
        });
};

exports.cancelById = async (req, res, next) => {
    const orderStatus = await Order.find({
        $and: [{ _id: mongoose.Types.ObjectId(req.params.orderId) }, { status: "Pending" }],
    });
    if (orderStatus.length === 0) {
        res.status(401).send({
            errors: { "Cannot cancel this order": ["It has already been shipped."] },
        });
    } else {
        Order.findById(req.params.orderId)
            .then(order => {
                User.updateOne({ _id: order.user.userId }, { $inc: { point: -100 } }).then(
                    result => {
                        Order.findByIdAndDelete(req.params.orderId)
                            .then(result => {
                                res.status(200).send({ result });
                            })
                            .catch(err => {
                                res.status(500).send({ errMsg: err });
                            });
                        // res.status(200).send(result);
                    }
                );
            })
            .catch(err => {
                res.status(500).send({ errMsg: err });
            });
    }
};

exports.review = (req, res, next) => {
    Order.updateOne(
        { _id: mongoose.Types.ObjectId(req.params.orderId) },
        { $set: { review: req.body.review } }
    )
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(500).send({ errMsg: err });
        });
};

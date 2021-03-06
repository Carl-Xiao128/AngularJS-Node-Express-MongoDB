const Product = require("../models/product-model").productModel;
const User = require("../models/user-model").userModel;
const ResponseApi = require("../models/response");
const mongoose = require("mongoose");

exports.getById = (req, resp, next) => {
    Product.findById(req.params.productId)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            // console.log(err);
            res.status(500).send({ errMsg: err });
        });
};

exports.list = (req, res, next) => {
    Product.find()
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            // console.log(err);
            res.status(500).send({ errMsg: err });
        });
};

exports.getCart = (req, res, next) => {
    User.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.params.buyerId) } },
        { $project: { _id: 0, cart: 1 } },
    ])
        .then(result => {
            res.status(200).send(new ResponseApi(200, "success", result));
        })
        .catch(err => {
            res.status(500).send(new ResponseApi(500, "error", err));
        });
};

exports.deleteCart = (req, res, next) => {
    User.findById(req.params.buyerId).then(result => {
        User.updateOne({ _id: mongoose.Types.ObjectId(req.params.buyerId) }, { $set: { cart: [] } })
            .then(result => {
                res.status(200).send(new ResponseApi(200, "success", result));
            })
            .catch(err => {
                res.status(500).send(new ResponseApi(500, "error", err));
            });
    });
};

exports.removeFromCart = (req, res, next) => {
    User.findById(req.params.buyerId).then(result => {
        User.updateOne(
            {
                _id: mongoose.Types.ObjectId(req.params.buyerId),
                "cart.productId": mongoose.Types.ObjectId(req.params.productId),
            },
            { $pull: { cart: { productId: mongoose.Types.ObjectId(req.params.productId) } } }
        )
            .then(result => {
                res.status(200).send(new ResponseApi(200, "success", result));
            })
            .catch(err => {
                res.status(500).send(new ResponseApi(500, "error", err));
            });
    });
};

exports.addToCart = async (req, res, next) => {
    const buyerId = req.params.buyerId;
    const prodId = req.params.productId;
    var isInCart = await User.find({ "cart.productId": mongoose.Types.ObjectId(prodId) });

    Product.findById(prodId)
        .then(product => {
            if (isInCart.length === 0) {
                User.updateOne(
                    { _id: mongoose.Types.ObjectId(buyerId) },
                    {
                        $push: {
                            cart: {
                                productId: product._id,
                                name: product.name,
                                price: product.price,
                                sellerId: product.userId,
                                quantity: 1,
                            },
                        },
                    }
                )
                    .then(result => {
                        res.status(200).send(new ResponseApi(200, "success", result));
                    })
                    .catch(err => {
                        res.status(500).send(new ResponseApi(500, "error", err));
                    });
            } else {
                User.updateOne(
                    {
                        _id: mongoose.Types.ObjectId(buyerId),
                        "cart.productId": mongoose.Types.ObjectId(prodId),
                    },
                    { $inc: { "cart.$.quantity": 1 } }
                )
                    .then(result => {
                        res.status(200).send(new ResponseApi(200, "success", result));
                    })
                    .catch(err => {
                        res.status(500).send(new ResponseApi(500, "error", err));
                    });
            }
        })
        .then(result => {
            // res.redirect('/buyer/:buyerId/cart');
        })
        .catch(err => console.log(err));
};

exports.review = (req, res, next) => {
    User.findById(req.params.buyerId).then(result => {
        Order.updateOne({_id:mongoose.Types.ObjectId(req.params.orderId)},
        {$set: {review:req.body.review}}
        )
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(500).send({errMsg: err});
        })
    });
}
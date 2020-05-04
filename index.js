const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const port = process.env.PORT ||3000;
const products = require("./data");
app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", "./views");
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded



app.get("/", (req, res) => {
  res.render("home", {
    products,
  });
});

app.get("/checkout", (req, res) => {
  const id=req.query.id
  const pos= products.findIndex(item=>item.id.toString()===id)
   if(pos>-1) res.render("checkout",{
     product: products[pos]
   });
  
 
});

const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

app.post("/pay", (req, res) => {
  
  const pos= products.findIndex(item=>item.id.toString()===req.body.id)
  if(pos>-1){
    const product=products[pos]
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${process.env.HOST}success`,
        cancel_url: `${process.env.HOST}cancel`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: product.name,
                
                price: product.price.toString(),
                currency: "USD",
                quantity: parseInt(req.body.quanty),
              }
            ],
          },
          amount: {
            currency: "USD",
            total: product.price* parseInt(req.body.quanty).toString(),
          },
          description: "Thanh toan san pham ec",
        },
      ],
    };
  
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  }
 
});

app.get("/success", (req, res) => {
  const paymentId = req.query.paymentId;
  var payerId = { payer_id: req.query.PayerID };
  if (payerId && paymentId) {
    paypal.payment.execute(paymentId, payerId, function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        res.send("Chúc mừng bạn đã thanh toán thanh công !");
      }
    });
  }
});

app.get("/cancel", (req, res) => res.send("Thanh toán thất bại!"));

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

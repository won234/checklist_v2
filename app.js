//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
// mongoose.connect("mongodb://localhost:27017/checklist", {
mongoose.connect("mongodb+srv://admin-kyle:test1234@cluster0-3dbgx.mongodb.net/checklist",
  {  useNewUrlParser: true,   useUnifiedTopology: true });
const itemSchema = new mongoose.Schema({
  content: String
});
const Item = new mongoose.model("Item", itemSchema);
const WorkItem = new mongoose.model("WorkItem", itemSchema);

//first initialize(default values to DB)
const item1 = new Item({
  content: "c 1111111111"
});
const item2 = new Item({
  content: "c 22222222"
});
const item3 = new Item({
  content: "c 3333333"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = new mongoose.model("List", listSchema);

let items = [];
app.get("/", function(req, res) {
  Item.find({}, (err, db_items) => {
    if (err) {
      console.log(err);
    } else {
      if (db_items.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Succesfully insert default items");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "TODAY",
          newListItems: db_items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list; //from value of submit button
  const db_item = new Item({
    content: itemName
  });
  if (listName === "TODAY") {
    db_item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      foundList.items.push(db_item);
      foundList.save().then(function(savedData) {
        res.redirect("/" + listName);
      }).catch(function(err) {
        console.log(err);
      });
    });
  }
});
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.chkbox;
  const listName = req.body.listName;
  // Item.deleteOne({_id:checkedItemId},(err)=>{
  if (listName === "TODAY") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("success delete");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},
      {$pull: {items: { _id: checkedItemId } } },
      function(err, foundList) {
        if (!err) { res.redirect("/" + listName);  }
      });
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: results.name,
          newListItems: results.items
        });
      }
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

import { List, String } from "./channelFn";
import { Element, Fragment } from "./dom";

// Create a simple, numeric list
const list = new List(["get shower curtain", "do laundry", "clean bath"]);

// The main app renders the list items on consecutive lines which are prefixed
// with "Num: "
const app = new Element(
  "div",
  new List([
    new Element("h1", new List([new Fragment(new String("Todos:"))])),
    new Element(
      "div",
      list.map(
        (todo) =>
          new Element(
            "div",
            new List([
              new Element(
                "label",
                new List([
                  new Element("input", new List([])),
                  new Fragment(new String(todo)),
                ])
              ),
            ])
          )
      )
    ),
  ])
);

// Mount the app to the document
app.mount(document.body);

// Try updating the app
console.log("update");

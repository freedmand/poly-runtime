import { List, String } from "./channelFn";
import { Element, Fragment } from "./dom";

// Create a simple, numeric list
const list = new List([1, 2, 3]);

// The main app renders the list items on consecutive lines which are prefixed
// with "Num: "
const app = new Element(
  "div",
  list.map(
    (number) =>
      new Element(
        "div",
        new List([
          new Fragment(new String("Num: ")),
          new Fragment(new String(`${number}`)),
        ])
      )
  )
);

// Mount the app to the document
app.mount(document.body);

// Try updating the app
console.log("update");
list.setItem(2, 10);
list.push(5);

import { AutomaticChannel, Channel } from "./channel";

// type ChildType = Element | Fragment | null | ChildType[] | Channel<ChildType>;

// export function* iterateChildren(
//   childLike: ChildType
// ): Iterable<Element | Fragment> {
//   if (childLike != null) {
//     if (Array.isArray(childLike)) {
//       for (const subChildLike of childLike) {
//         iterateChildren(subChildLike);
//       }
//     } else {
//       yield childLike;
//     }
//   }
// }

/**
 * The type description of an element
 */
export interface ElementType {
  tag: string;
  attributes: Attribute[];
  children: (Element | Fragment)[];
}

export type Attribute = GeneralAttribute;

export interface GeneralAttribute {
  type: "GeneralAttribute";
  key: string;
  value: string;
}

/**
 * The base class for all DOM channels. Any DOM channel is mountable and
 * renderable and stores a reference to its connected node. DOM channels inherit
 * from automatic channels so they can watch an underlying data stream for
 * changes.
 */
export abstract class BaseDOM<
  DataType,
  IncomingChannelType extends Channel<any>[] | [Channel<any>]
> extends AutomaticChannel<DataType, IncomingChannelType> {
  // The node that the channel is mounted on, or null if it is unmounted
  public node: Node | null = null;

  // Render the actual DOM node
  abstract render(): Node;

  // Mount the node into a parent
  mount(parent: Node) {
    const node = this.render();
    this.node = node;
    parent.appendChild(node);
  }
}

/**
 * A fragment renders HTML text nodes
 */
export class Fragment extends BaseDOM<string, [Channel<string>]> {
  public node: Text | null = null;

  render(): Text {
    const data = this.data;
    // Render text
    return document.createTextNode(data);
  }

  update(node: Text, newData: string): void {
    // Update the text content
    node.textContent = newData;
  }

  constructor(incomingData: Channel<string>) {
    super(
      [incomingData],
      (newData) => {
        // Upon receiving new data, update the text contents
        if (this.node != null) {
          this.update(this.node, newData);
        }
        return newData;
      },
      undefined,
      undefined,
      // Eagerly update to reflect DOM changes immediately
      true
    );
  }
}

/**
 * An element renders HTML elements
 */
export class Element extends BaseDOM<
  ElementType,
  [Channel<Attribute[]>, Channel<(Element | Fragment)[]>]
> {
  render(): HTMLElement {
    const data = this.data;
    // Create the actual element
    const element = document.createElement(data.tag);
    const children = data.children;
    for (const child of children) {
      // Mount all the children onto the created element
      child.mount(element);
    }
    return element;
  }

  updateIndex(node: Node, index: number, newData: Element | Fragment): void {
    if (index === node.childNodes.length) {
      // Append new node
      node.appendChild(newData.render());
    } else {
      // Replace existing node
      node.replaceChild(newData.render(), node.childNodes[index]);
    }
  }

  update(node: Node, children: (Element | Fragment)[]): void {
    // Remove the children, if present
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    // Rerender the children
    for (const child of children) {
      child.mount(node);
    }
  }

  constructor(
    readonly tag: string,
    attributes: Channel<Attribute[]>,
    children: Channel<(Element | Fragment)[]>
  ) {
    super(
      [attributes, children],
      (attributes, children) => {
        if (this.node != null) {
          // Update everything upon receiving an update
          this.update(this.node, attributes, children);
        }
        // Return a description of the element
        return {
          tag,
          attributes,
          children,
        };
      },
      [(index) => index],
      (items, data, index) => {
        if (this.node != null) {
          // Update just the children that changed
          this.updateIndex(
            this.node,
            index as number,
            items[0][index as number]
          );
        }
      },
      // Eagerly receive updates to reflect DOM changes immediately
      true
    );
  }
}

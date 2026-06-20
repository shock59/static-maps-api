type Handler<T> = (item: T) => void;

export default class Queue<T> {
  #handler: Handler<T>;
  #items: T[];
  #executing: boolean;

  constructor(handler: Handler<T>) {
    this.#handler = handler;
    this.#items = [];
    this.#executing = false;
  }

  enqueue(item: T) {
    this.#items.push(item);
    this.#dequeue();
  }

  async #dequeue() {
    if (this.#items.length === 0) {
      this.#executing = false;
      return;
    } else if (this.#executing) return;

    this.#executing = true;
    const item = this.#items.shift()!;
    await this.#handler(item);
    this.#executing = false;
    this.#dequeue();
  }
}

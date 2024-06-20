interface IQueue<T> {
  enqueue(value: T): boolean;
  dequeue(): T | undefined;
  length(): number;
}

export class ReadableQueue<T> implements IQueue<T> {
  public readonly queue: T[] = [];

  constructor(private _capacity: number = Infinity) {}

  public enqueue(value: T): boolean {
    if (this.queue.length == this._capacity) {
      return false;
    }

    this.queue.push(value);
    return true;
  }

  public dequeue(): T | undefined {
    return this.queue.shift();
  }

  public length(): number {
    return this.queue.length;
  }
}

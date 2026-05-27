import Vector2 from './vector2.ts';

export default class Edge {
    start: Vector2;
    end: Vector2;

    constructor(start: Vector2, end: Vector2) {
        this.start = start.clone();
        this.end = end.clone();
    }

    clone(): this {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    translate(offset: Vector2): this {
        this.start.add(offset);
        this.end.add(offset);
        return this;
    }

    reverse(): this {
        [this.start, this.end] = [this.end, this.start];
        return this;
    }

    direction(): Vector2 {
        return Vector2.sub(this.end, this.start);
    }

    static translate(edge: Edge, offset: Vector2): Edge {
        return new Edge(
            Vector2.add(edge.start, offset),
            Vector2.add(edge.end, offset)
        );
    }

    static reverse(edge: Edge): Edge {
        return new Edge(edge.end, edge.start);
    }
}
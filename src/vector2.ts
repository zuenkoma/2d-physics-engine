export default class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    clone(): this {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    add(other: Vector2): this {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    sub(other: Vector2): this {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    mult(value: number): this {
        this.x *= value;
        this.y *= value;
        return this;
    }
    div(value: number): this {
        this.x /= value;
        this.y /= value;
        return this;
    }

    perp(): this {
        const x = -this.y;
        this.y = this.x;
        this.x = x;
        return this;
    }
    normalize(): this {
        return this.div(this.length);
    }

    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }
    cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
    }

    rotate(angle: number): this {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    get lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }
    get length(): number {
        return Math.sqrt(this.lengthSquared);
    }

    get angle(): number {
        return Math.atan2(this.y, this.x);
    }

    static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x + b.x, a.y + b.y);
    }
    static sub(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x - b.x, a.y - b.y);
    }
    static mult(vector: Vector2, value: number): Vector2 {
        return new Vector2(vector.x * value, vector.y * value);
    }
    static div(vector: Vector2, value: number): Vector2 {
        return new Vector2(vector.x / value, vector.y / value);
    }

    static perp(vector: Vector2): Vector2 {
        return new Vector2(-vector.y, vector.x);
    }
    static normalize(vector: Vector2): Vector2 {
        return Vector2.div(vector, vector.length);
    }
}
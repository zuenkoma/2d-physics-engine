export default class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    set(vector: Vector2): this {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }

    clone(): this {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    add(vector: Vector2): this {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    sub(vector: Vector2): this {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
    mult(value: number): this {
        this.x *= value;
        this.y *= value;
        return this;
    }

    div(value: number): this;
    div(value: Vector2): this;
    div(valueOrVec: number | Vector2): this {
        if (valueOrVec instanceof Vector2) {
            this.x /= valueOrVec.x;
            this.y /= valueOrVec.y;
        }
        else {
            this.x /= valueOrVec;
            this.y /= valueOrVec;
        }
        return this;
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }
    length(): number {
        return Math.sqrt(this.lengthSquared());
    }
    normalize(): this {
        const length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    }

    dot(vector: Vector2): number {
        return this.x * vector.x + this.y * vector.y;
    }
    cross(vector: Vector2): number {
        return this.x * vector.y - this.y * vector.x;
    }

    perp(): this {
        const x = -this.y;
        this.y = this.x;
        this.x = x;
        return this;
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
    getAngle(): number {
        return Math.atan2(this.x, this.y);
    }
}
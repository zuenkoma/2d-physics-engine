export default class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    set(other: Vector2): this {
        this.x = other.x;
        this.y = other.y;
        return this;
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
    mult(other: number): this {
        this.x *= other;
        this.y *= other;
        return this;
    }

    div(value: number): this;
    div(other: Vector2): this;
    div(valueOrOther: number | Vector2): this {
        if (valueOrOther instanceof Vector2) {
            this.x /= valueOrOther.x;
            this.y /= valueOrOther.y;
        }
        else {
            this.x /= valueOrOther;
            this.y /= valueOrOther;
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

    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }
    cross(other: Vector2): number {
        return this.x * other.y - this.y * other.x;
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
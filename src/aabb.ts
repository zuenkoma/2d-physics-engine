import Vector2 from './vector2.ts';

export default class AABB {
    min: Vector2;
    max: Vector2;

    constructor(min: Vector2 = new Vector2(Infinity, Infinity), max: Vector2 = new Vector2(-Infinity, -Infinity)) {
        this.min = min;
        this.max = max;
    }

    intersects(other: AABB): boolean {
        return (
            this.min.x <= other.max.x && this.max.x >= other.min.x &&
            this.min.y <= other.max.y && this.max.y >= other.min.y
        );
    }

    encapsulate(other: AABB): this {
        this.min.x = Math.min(this.min.x, other.min.x);
        this.min.y = Math.min(this.min.y, other.min.y);
        this.max.x = Math.max(this.max.x, other.max.x);
        this.max.y = Math.max(this.max.y, other.max.y);
        return this;
    }
}
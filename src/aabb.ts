import type Vector2 from './vector2.ts';

export default class AABB {
    min: Vector2;
    max: Vector2;

    constructor(min: Vector2, max: Vector2) {
        this.min = min;
        this.max = max;
    }

    isIntersects(aabb: AABB) {
        return this.min.x <= aabb.max.x && this.max.x >= aabb.min.x && this.min.y <= aabb.max.y && this.max.y >= aabb.min.y;
    }
}
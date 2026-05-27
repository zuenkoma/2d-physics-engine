import AABB from '../aabb.ts';
import Vector2 from '../vector2.ts';
import Collider from './collider.ts';

export default class CircleCollider extends Collider {
    radius: number;

    constructor(radius: number, offset?: Vector2) {
        super(offset);
        this.radius = radius;
    }

    getAABB(): AABB {
        const center = this.getCenter();
        const min = Vector2.sub(center, new Vector2(this.radius, this.radius));
        const max = Vector2.add(center, new Vector2(this.radius, this.radius));
        return new AABB(min, max);
    }

    getFurthestPoint(direction: Vector2): Vector2 {
        return this.getCenter().add(Vector2.normalize(direction).mult(this.radius));
    }

    calculateInertia(mass: number): number {
        return mass * this.radius ** 2 / 2;
    }
}
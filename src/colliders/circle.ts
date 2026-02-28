import AABB from '../aabb.ts';
import Vector2 from '../vector2.ts';
import Collider from './collider.ts';

export default class CircleCollider extends Collider {
    radius: number;

    constructor(radius: number, offset = new Vector2(0, 0)) {
        super(offset);
        this.radius = radius;
    }

    getAABB() {
        const center = this.getCenter();
        const min = center.clone().sub(new Vector2(this.radius, this.radius));
        const max = center.clone().add(new Vector2(this.radius, this.radius));
        return new AABB(min, max);
    }

    getFurthestPoint(direction: Vector2) {
        const center = this.getCenter();
        return center.clone().add(direction.clone().normalize().mult(this.radius));
    }

    calculateInertia(mass: number) {
        return mass * this.radius ** 2 / 2;
    }
}
import AABB from '../aabb.ts';
import Vector2 from '../vector2.ts';
import Collider from './collider.ts';

export default class CapsuleCollider extends Collider {
    height: number;
    radius: number;
    rotation: number;

    constructor(height: number, radius: number, offset = new Vector2(0, 0), rotation = 0) {
        super(offset);
        this.height = height;
        this.radius = radius;
        this.rotation = rotation;
    }

    getEndpoints() {
        const halfHeight = new Vector2(0, 1).rotate(this.rotation).mult(this.height / 2 - this.radius);
        const start = halfHeight.clone().add(this.offset);
        const end = halfHeight.clone().mult(-1).add(this.offset);
        if (this.body) {
            start.rotate(this.body.rotation).add(this.body.position);
            end.rotate(this.body.rotation).add(this.body.position);
        }
        return { start, end };
    }

    getAABB() {
        const { start, end } = this.getEndpoints();
        const radius = new Vector2(this.radius, this.radius);
        const min = new Vector2(Math.min(start.x, end.x), Math.min(start.y, end.y));
        const max = new Vector2(Math.max(start.x, end.x), Math.max(start.y, end.y));
        return new AABB(min.sub(radius), max.add(radius));
    }

    getFurthestPoint(direction: Vector2) {
        const { start, end } = this.getEndpoints();
        const dotStart = start.dot(direction);
        const dotEnd = end.dot(direction);
        const basePoint = dotEnd > dotStart ? end : start;
        return basePoint.clone().add(direction.clone().normalize().mult(this.radius));
    }

    getClosestEdge(direction: Vector2): [Vector2, Vector2] {
        const { start, end } = this.getEndpoints();
        const perp = end.clone().sub(start).perp().normalize();
        if (Math.abs(perp.cross(direction)) < 1e-6) {
            const offset = perp.mult(Math.sign(-perp.dot(direction)) * this.radius);
            return [start.add(offset), end.add(offset)];
        }
        const point = this.getFurthestPoint(direction.clone().mult(-1));
        const perp2 = point.clone().sub(direction.dot(start) > direction.dot(end) ? start : end).perp().normalize().mult(1e-6);
        return [
            point.clone().sub(perp2),
            point.clone().add(perp2)
        ];
    }

    calculateInertia(mass: number) {
        const cylinderHeight = Math.max(0, this.height - 2 * this.radius);
        const cylinderMass = mass * (cylinderHeight / this.height);
        const hemisphereMass = mass * (this.radius / this.height);
        const cylinderInertia = cylinderMass * cylinderHeight ** 2 / 12;
        const hemisphereDistance = cylinderHeight / 2 + this.radius * 0.75;
        const hemisphereInertia = (2 / 5) * hemisphereMass * this.radius ** 2 + hemisphereMass * hemisphereDistance ** 2;
        return cylinderInertia + 2 * hemisphereInertia;
    }
}
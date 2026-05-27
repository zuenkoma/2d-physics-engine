import AABB from '../aabb.ts';
import Edge from '../edge.ts';
import Vector2 from '../vector2.ts';
import Collider from './collider.ts';

export default class CapsuleCollider extends Collider {
    height: number;
    radius: number;
    rotation: number;

    constructor(height: number, radius: number, offset?: Vector2, rotation = 0) {
        super(offset);
        this.height = height;
        this.radius = radius;
        this.rotation = rotation;
    }

    getEndpoints(): Edge {
        const halfHeight = new Vector2(0, 1).rotate(this.rotation).mult(this.height / 2 - this.radius);
        const start = halfHeight.clone().add(this.offset);
        const end = halfHeight.clone().mult(-1).add(this.offset);
        if (this.body) {
            start.rotate(this.body.rotation).add(this.body.position);
            end.rotate(this.body.rotation).add(this.body.position);
        }
        return new Edge(start, end);
    }

    getAABB(): AABB {
        const { start, end } = this.getEndpoints();
        const radius = new Vector2(this.radius, this.radius);
        const min = new Vector2(Math.min(start.x, end.x), Math.min(start.y, end.y));
        const max = new Vector2(Math.max(start.x, end.x), Math.max(start.y, end.y));
        return new AABB(min.sub(radius), max.add(radius));
    }

    getFurthestPoint(direction: Vector2): Vector2 {
        const { start, end } = this.getEndpoints();
        const dotStart = start.dot(direction);
        const dotEnd = end.dot(direction);
        const basePoint = dotEnd > dotStart ? end : start;
        return Vector2.add(basePoint, Vector2.normalize(direction).mult(this.radius));
    }

    getClosestEdge(direction: Vector2): Edge {
        const { start, end } = this.getEndpoints();
        const perp = Vector2.sub(end, start).perp().normalize();
        if (Math.abs(perp.cross(direction)) < 1e-6) {
            const sign = Math.sign(perp.dot(direction));
            const offset = Vector2.mult(perp, sign * this.radius);
            const p1 = Vector2.sub(start, offset);
            const p2 = Vector2.sub(end, offset);
            return sign > 0 ? new Edge(p1, p2) : new Edge(p2, p1);
        }
        const point = this.getFurthestPoint(Vector2.mult(direction, -1));
        return new Edge(point, point);
    }

    calculateInertia(mass: number): number {
        const cylinderHeight = Math.max(0, this.height - 2 * this.radius);
        const cylinderMass = mass * (cylinderHeight / this.height);
        const hemisphereMass = mass * (this.radius / this.height);
        const cylinderInertia = cylinderMass * cylinderHeight ** 2 / 12;
        const hemisphereDistance = cylinderHeight / 2 + this.radius * 0.75;
        const hemisphereInertia = (2 / 5) * hemisphereMass * this.radius ** 2 + hemisphereMass * hemisphereDistance ** 2;
        return cylinderInertia + 2 * hemisphereInertia;
    }
}
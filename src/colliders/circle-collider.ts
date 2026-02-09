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

    getClosestEdge(direction: Vector2): [Vector2, Vector2] {
        const point = this.getFurthestPoint(direction.clone().mult(-1));
        const perp = direction.clone().perp().mult(1e-6);
        return [
            point.clone().sub(perp),
            point.clone().add(perp)
        ];
    }

    calculateInertia(mass: number) {
        return mass * this.radius ** 2 / 2;
    }

    renderShape(ctx: CanvasRenderingContext2D, fill = false) {
        const center = this.getCenter();
        ctx.beginPath();
        ctx.arc(center.x, center.y, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        if (fill) ctx.fill();
    }
}
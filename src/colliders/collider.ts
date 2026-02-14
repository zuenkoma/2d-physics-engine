import type AABB from '../aabb.ts';
import type Body from '../body.ts';
import Vector2 from '../vector2.ts';

export default abstract class Collider {
    body: Body | null = null;
    offset: Vector2;

    constructor(position = new Vector2(0, 0)) {
        this.offset = position;
    }

    getCenter() {
        const center = this.offset.clone();
        if (this.body) center.rotate(this.body.rotation).add(this.body.position);
        return center;
    }

    abstract getAABB(): AABB;
    abstract getFurthestPoint(direction: Vector2): Vector2;
    abstract getClosestEdge(direction: Vector2): [Vector2, Vector2];
    abstract calculateInertia(mass: number): number;
    abstract renderShape(ctx: CanvasRenderingContext2D, fill: boolean): void;

    renderAABB(ctx: CanvasRenderingContext2D, fill: boolean) {
        const aabb = this.getAABB();
        ctx.beginPath();
        ctx.rect(aabb.min.x, aabb.min.y, aabb.max.x - aabb.min.x, aabb.max.y - aabb.min.y);
        ctx.stroke();
        if (fill) ctx.fill();
    }
}
import AABB from '../aabb.js';
import type Body from '../body.ts';
import Edge from '../edge.ts';
import gjk from '../gjk.ts';
import Vector2 from '../vector2.ts';

export default class Collider {
    body: Body | null = null;
    offset: Vector2;
    isTrigger = false;

    constructor(position?: Vector2) {
        this.offset = position ? position.clone() : new Vector2(0, 0);
    }

    getCenter(): Vector2 {
        const center = this.offset.clone();
        if (this.body) center.rotate(this.body.rotation).add(this.body.position);
        return center;
    }

    getAABB(): AABB {
        const center = this.getCenter();
        return new AABB(center, center);
    }

    getFurthestPoint(_direction: Vector2): Vector2 {
        return this.getCenter();
    }

    getClosestEdge(direction: Vector2): Edge {
        const point = this.getFurthestPoint(Vector2.mult(direction, -1));
        return new Edge(point, point);
    }

    calculateInertia(_mass: number): number {
        return 0;
    }

    intersects(other: Collider): boolean {
        return (
            this.getAABB().intersects(other.getAABB()) &&
            gjk(this, other) !== null
        );
    }
}
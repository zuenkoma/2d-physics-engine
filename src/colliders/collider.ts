import AABB from "../aabb.js";
import type Body from '../body.ts';
import gjk from '../gjk.ts';
import Vector2 from '../vector2.ts';

export default class Collider {
    body: Body | null = null;
    offset: Vector2;

    constructor(position = new Vector2(0, 0)) {
        this.offset = position;
    }

    getCenter(): Vector2 {
        const center = this.offset.clone();
        if (this.body) center.rotate(this.body.rotation).add(this.body.position);
        return center;
    }

    getAABB(): AABB {
        const center = this.getCenter();
        return new AABB(center, center.clone());
    }

    getFurthestPoint(_direction: Vector2): Vector2 {
        return this.getCenter();
    }

    getClosestEdge(direction: Vector2): [Vector2, Vector2] {
        const point = this.getFurthestPoint(direction.clone().mult(-1));
        const perp = direction.clone().perp().mult(1e-6);
        return [
            point.clone().sub(perp),
            point.clone().add(perp)
        ];
    }

    calculateInertia(_mass: number): number {
        return 0;
    }

    containsPoint(point: Vector2): boolean {
        const pointCollider = new Collider(point);
        const simplex = gjk(this, pointCollider);
        return simplex !== null;
    }
}
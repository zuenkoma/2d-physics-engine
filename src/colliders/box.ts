import AABB from '../aabb.ts';
import Vector2 from '../vector2.ts';
import Collider from './collider.ts';

export default class BoxCollider extends Collider {
    size: Vector2;
    rotation: number;

    constructor(size: Vector2, offset = new Vector2(0, 0), rotation = 0) {
        super(offset);
        this.size = size;
        this.rotation = rotation;
    }

    getVertices() {
        const halfSize = this.size.clone().div(2);
        const vertices = [
            new Vector2(-halfSize.x, -halfSize.y),
            new Vector2(halfSize.x, -halfSize.y),
            new Vector2(halfSize.x, halfSize.y),
            new Vector2(-halfSize.x, halfSize.y)
        ];
        for (const vertex of vertices) {
            vertex.rotate(this.rotation).add(this.offset);
            if (this.body) vertex.rotate(this.body.rotation).add(this.body.position);
        }
        return vertices;
    }

    getAABB() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const vertex of this.getVertices()) {
            minX = Math.min(minX, vertex.x);
            minY = Math.min(minY, vertex.y);
            maxX = Math.max(maxX, vertex.x);
            maxY = Math.max(maxY, vertex.y);
        }

        return new AABB(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    getFurthestPoint(direction: Vector2) {
        let max = -Infinity;
        let furthestPoint!: Vector2;
        for (const vertex of this.getVertices()) {
            const dot = vertex.dot(direction);
            if (dot > max) {
                max = dot;
                furthestPoint = vertex;
            }
        }
        return furthestPoint;
    }

    getClosestEdge(direction: Vector2) {
        let min = Infinity;
        let edge: [Vector2, Vector2];
        const vertices = this.getVertices();
        for (let i = 0; i < 4; ++i) {
            const start = vertices[i];
            const end = vertices[(i + 1) % 4];
            const dot = start.clone().sub(end).perp().dot(direction);
            if (dot < min) {
                min = dot;
                edge = [start, end];
            }
        }
        return edge!;
    }

    calculateInertia(mass: number) {
        return mass * this.size.lengthSquared() / 12;
    }
}
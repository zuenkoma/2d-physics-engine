import type Collider from './colliders/collider.ts';
import Vector2 from './vector2.ts';

export default function epa(simplex: [Vector2, Vector2, Vector2], collider1: Collider, collider2: Collider) {
    const polytope = simplex.map(v => v.clone());

    while (true) {
        let minDistance = Infinity;
        let minNormal!: Vector2;
        let index!: number;

        for (let i = 0; i < polytope.length; ++i) {
            const j = (i + 1) % polytope.length;

            const point1 = polytope[i];
            const point2 = polytope[j];
            const normal = point2.clone().sub(point1).perp().normalize();
            const distance = normal.dot(point1);

            if (distance < minDistance) {
                minDistance = distance;
                minNormal = normal;
                index = j;
            }
        }

        const point1 = collider1.getFurthestPoint(minNormal);
        const point2 = collider2.getFurthestPoint(minNormal.clone().mult(-1));
        const support = point1.clone().sub(point2);
        const distance = minNormal.dot(support);

        if (distance - minDistance > 1e-6) {
            polytope.splice(index, 0, support);
        }
        if (distance - minDistance <= 1e-6 || polytope.length >= 50) {
            return minNormal.mult(-minDistance);
        }
    }
}
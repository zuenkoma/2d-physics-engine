import type Collider from './colliders/collider.ts';
import Vector2 from './vector2.ts';

export default function gjk(collider1: Collider, collider2: Collider): [Vector2, Vector2, Vector2] | null {
    let direction = collider2.getCenter().sub(collider1.getCenter());
    if (direction.x === 0 && direction.y === 0) {
        direction = new Vector2(1, 0);
    }
    else direction.normalize();

    const simplex: Vector2[] = [];

    for (let i = 0; i < 50; ++i) {
        const point1 = collider1.getFurthestPoint(direction);
        const point2 = collider2.getFurthestPoint(Vector2.mult(direction, -1));

        const support = Vector2.sub(point1, point2);
        if (support.dot(direction) <= 0) return null;
        simplex.push(support);

        switch (simplex.length) {
            case 1: {
                const [a] = simplex;
                direction = Vector2.mult(a, -1).normalize();
                break;
            }
            case 2: {
                const [b, a] = simplex;
                const ba = Vector2.sub(a, b);
                if (ba.dot(a) < 0) return null;
                const perp = Vector2.perp(ba);
                if (perp.dot(a) > 0) perp.mult(-1);
                direction = perp.normalize();
                break;
            }
            case 3: {
                const [c, b, a] = simplex;
                const ba = Vector2.sub(a, b);
                const ca = Vector2.sub(a, c);
                const baPerp = ba.clone().perp();
                const perpB = Vector2.mult(baPerp, ba.cross(ca));
                if (perpB.dot(a) < 0) {
                    simplex.splice(1, 1);
                    direction = perpB.normalize();
                    break;
                }
                const perpC = Vector2.perp(ca).mult(ca.cross(ba));
                if (perpC.dot(a) < 0) {
                    simplex.splice(0, 1);
                    direction = perpC.normalize();
                    break;
                }
                return baPerp.dot(ca) < 0 ? [b, c, a] : [c, b, a];
            }
        }
    }
    return null;
}
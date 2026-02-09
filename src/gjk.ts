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
        const point2 = collider2.getFurthestPoint(direction.clone().mult(-1));

        const support = point1.clone().sub(point2);
        if (support.dot(direction) <= 0) return null;
        simplex.push(support);

        switch (simplex.length) {
            case 1: {
                const [a] = simplex;
                direction.set(a).mult(-1).normalize();
                break;
            }
            case 2: {
                const [b, a] = simplex;
                const ba = a.clone().sub(b);
                if (ba.dot(a) < 0) return null;
                const perp = ba.clone().perp();
                if (perp.dot(a) > 0) perp.mult(-1);
                direction.set(perp).normalize();
                break;
            }
            case 3: {
                const [c, b, a] = simplex;
                const ba = a.clone().sub(b);
                const ca = a.clone().sub(c);
                const baPerp = ba.clone().perp();
                const perpB = baPerp.clone().mult(ba.cross(ca));
                if (perpB.dot(a) < 0) {
                    simplex.splice(1, 1);
                    direction.set(perpB).normalize();
                    break;
                }
                const perpC = ca.clone().perp().mult(ca.cross(ba));
                if (perpC.dot(a) < 0) {
                    simplex.splice(0, 1);
                    direction.set(perpC).normalize();
                    break;
                }
                return baPerp.dot(ca) < 0 ? [b, c, a] : [c, b, a];
            }
        }
    }
    return null;
}
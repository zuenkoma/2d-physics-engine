import clipping from './clipping.ts';
import type Collider from './colliders/collider.ts';
import Body from './body.ts';
import epa from './epa.ts';
import gjk from './gjk.ts';
import Vector2 from './vector2.ts';

interface Contact {
    point: Vector2;
    bias: number;
    normalMass: number;
    tangentMass: number;
    normalImpulse: number;
    tangentImpulse: number;
}

interface ContactManifold {
    collider1: Collider;
    collider2: Collider;
    contacts: Contact[];
    normal: Vector2;
    friction: number;
}

export default class World {
    bodies: Body[] = [];
    private manifoldCache: ContactManifold[] = [];

    gravity = new Vector2(0, -9.81);

    addBody(body: Body) {
        if (this.bodies.includes(body)) return;
        this.bodies.push(body);
    }
    removeBody(body: Body) {
        this.bodies.splice(this.bodies.indexOf(body), 1);
    }

    step(dt: number, iterations = 15) {
        for (const body of this.bodies) {
            body.onGround = false;
            if (body.isStatic()) continue;
            body.velocity.add(this.gravity.clone().mult(dt));
        }

        const manifolds: ContactManifold[] = [];
        for (let i = 0; i < this.bodies.length; ++i) {
            const body1 = this.bodies[i];
            for (let j = i + 1; j < this.bodies.length; ++j) {
                const body2 = this.bodies[j];

                for (const collider1 of body1.colliders) {
                    for (const collider2 of body2.colliders) {
                        const simplex = gjk(collider1, collider2);
                        if (!simplex) continue;

                        const mtv = epa(simplex, collider1, collider2);
                        const depth = mtv.length();
                        if (depth === 0) continue;

                        const normal = mtv.clone().div(depth);
                        const points = clipping(collider1, collider2, normal);
                        const cachedManifold = this.manifoldCache.find(manifold =>
                            ((manifold.collider1 === collider1 && manifold.collider2 === collider2) ||
                                (manifold.collider1 === collider2 && manifold.collider2 === collider1)) &&
                            manifold.contacts.length === points.length
                        );

                        if (body2.position.clone().sub(body1.position).dot(body2.velocity.clone().sub(body1.velocity)) <= 0) {
                            if (normal.y > 0.3) body1.onGround = true;
                            if (normal.y < -0.3) body2.onGround = true;
                        }

                        manifolds.push({
                            collider1, collider2,
                            contacts: points.map(([point, penetration]) => {
                                let normalImpulse = 0;
                                let tangentImpulse = 0;
                                if (cachedManifold) {
                                    let minDistance = Infinity;
                                    for (const contact of cachedManifold.contacts) {
                                        const distance = contact.point.clone().sub(point).lengthSquared();
                                        if (distance < minDistance && distance < 0.1) {
                                            minDistance = distance;
                                            normalImpulse = contact.normalImpulse * 0.95;
                                            tangentImpulse = contact.tangentImpulse * 0.95;
                                        }
                                    }
                                }
                                return {
                                    point,
                                    bias: 0.5 / dt * Math.max(0, penetration - 0.01),
                                    normalMass: Body.getEffectiveMass(body1, body2, point, normal),
                                    tangentMass: Body.getEffectiveMass(body1, body2, point, normal.clone().perp()),
                                    normalImpulse, tangentImpulse
                                };
                            }),
                            normal,
                            friction: Math.sqrt(body1.friction * body2.friction)
                        });
                    }
                }
            }
        }
        this.manifoldCache = manifolds;

        for (let i = 0; i < iterations; ++i) {
            for (const manifold of manifolds) {
                const body1 = manifold.collider1.body!;
                const body2 = manifold.collider2.body!;

                for (const contact of manifold.contacts) {
                    const velocity1 = body1.getVelocityAtPoint(contact.point);
                    const velocity2 = body2.getVelocityAtPoint(contact.point);
                    const relativeVelocity = velocity1.clone().sub(velocity2);

                    const normalVelocity = relativeVelocity.dot(manifold.normal);
                    const oldNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse = Math.max(0, oldNormalImpulse - (normalVelocity - contact.bias) * contact.normalMass);

                    const normalImpulse = manifold.normal.clone().mult(contact.normalImpulse - oldNormalImpulse);
                    body1.applyImpulse(normalImpulse, contact.point);
                    body2.applyImpulse(normalImpulse.clone().mult(-1), contact.point);

                    const tangent = manifold.normal.clone().perp();
                    const tangentVelocity = relativeVelocity.dot(tangent);

                    const oldTangentImpulse = contact.tangentImpulse;
                    const maxTangentImpulse = manifold.friction * contact.normalImpulse;
                    contact.tangentImpulse = Math.max(-maxTangentImpulse, Math.min(maxTangentImpulse, oldTangentImpulse - tangentVelocity * contact.tangentMass));
                    const tangentImpulse = tangent.clone().mult(contact.tangentImpulse - oldTangentImpulse);
                    body1.applyImpulse(tangentImpulse, contact.point);
                    body2.applyImpulse(tangentImpulse.clone().mult(-1), contact.point);
                }
            }
        }

        for (const body of this.bodies) {
            body.position.add(body.velocity.clone().mult(dt));
            body.rotation += body.angularVelocity * dt;
        }
    }
}
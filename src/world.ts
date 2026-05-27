import clipping from './clipping.ts';
import type Collider from './colliders/collider.ts';
import Body from './body.ts';
import epa from './epa.ts';
import gjk from './gjk.ts';
import Vector2 from './vector2.ts';

interface Contact {
    point: Vector2;
    penetration: number;
    normalImpulse: number;
    tangentImpulse: number;
    normalMass: number;
    tangentMass: number;
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

    addBody(body: Body): void {
        if (this.bodies.includes(body)) return;
        this.bodies.push(body);
    }
    removeBody(body: Body): void {
        this.bodies.splice(this.bodies.indexOf(body), 1);
    }

    step(dt: number, iterations = 10, substeps = 5): void {
        for (let s = 0; s < substeps; ++s) {
            for (const body of this.bodies) {
                body.isGrounded = false;
                body.groundVelocity = new Vector2(0, 0);
                if (body.inverseMass === 0) continue;
                body.velocity.add(Vector2.mult(this.gravity, dt / substeps / 2));
            }

            const manifolds: ContactManifold[] = [];
            for (let b1 = 0; b1 < this.bodies.length; ++b1) {
                const body1 = this.bodies[b1];
                const aabb1 = body1.getAABB();

                for (let b2 = b1 + 1; b2 < this.bodies.length; ++b2) {
                    const body2 = this.bodies[b2];
                    const aabb2 = body2.getAABB();
                    if (!aabb1.intersects(aabb2)) continue;

                    for (const collider1 of body1.colliders) {
                        if (collider1.isTrigger) continue;

                        for (const collider2 of body2.colliders) {
                            if (collider2.isTrigger) continue;

                            const simplex = gjk(collider1, collider2);
                            if (!simplex) continue;

                            const mtv = epa(simplex, collider1, collider2);
                            const depth = mtv.length;
                            if (depth === 0) continue;

                            const normal = Vector2.div(mtv, depth);
                            const points = clipping(collider1, collider2, normal);
                            const cachedManifold = this.manifoldCache.find(manifold =>
                                ((manifold.collider1 === collider1 && manifold.collider2 === collider2) ||
                                    (manifold.collider1 === collider2 && manifold.collider2 === collider1)) &&
                                manifold.contacts.length === points.length
                            );

                            manifolds.push({
                                collider1, collider2,
                                contacts: points.map(([point, penetration]) => {
                                    let normalImpulse = 0;
                                    let tangentImpulse = 0;
                                    if (cachedManifold) {
                                        let minDistance = Infinity;
                                        for (const contact of cachedManifold.contacts) {
                                            const distance = Vector2.sub(contact.point, point).lengthSquared;
                                            if (distance < minDistance && distance < 0.1) {
                                                minDistance = distance;
                                                normalImpulse = contact.normalImpulse * 0.95;
                                                tangentImpulse = contact.tangentImpulse * 0.95;
                                            }
                                        }
                                    }
                                    return {
                                        point, penetration, normalImpulse, tangentImpulse,
                                        normalMass: Body.getEffectiveMass(body1, body2, point, normal),
                                        tangentMass: Body.getEffectiveMass(body1, body2, point, Vector2.perp(normal))
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
                        const relativeVelocity = Vector2.sub(velocity2, velocity1);

                        const normalVelocity = relativeVelocity.dot(manifold.normal);
                        const oldNormalImpulse = contact.normalImpulse;
                        contact.normalImpulse = Math.max(0, oldNormalImpulse - normalVelocity * contact.normalMass);

                        const normalImpulse = Vector2.mult(manifold.normal, contact.normalImpulse - oldNormalImpulse);
                        body1.applyImpulse(Vector2.mult(normalImpulse, -1), contact.point);
                        body2.applyImpulse(normalImpulse, contact.point);

                        const tangent = Vector2.perp(manifold.normal);
                        const tangentVelocity = relativeVelocity.dot(tangent);

                        const oldTangentImpulse = contact.tangentImpulse;
                        const maxTangentImpulse = manifold.friction * contact.normalImpulse;
                        contact.tangentImpulse = Math.max(-maxTangentImpulse, Math.min(maxTangentImpulse, oldTangentImpulse - tangentVelocity * contact.tangentMass));
                        const tangentImpulse = Vector2.mult(tangent, contact.tangentImpulse - oldTangentImpulse);
                        body1.applyImpulse(Vector2.mult(tangentImpulse, -1), contact.point);
                        body2.applyImpulse(tangentImpulse, contact.point);
                    }
                }
            }

            for (const manifold of manifolds) {
                const body1 = manifold.collider1.body!;
                const body2 = manifold.collider2.body!;

                if (manifold.normal.y < -0.7 && body1.inverseMass !== 0) {
                    body1.isGrounded = true;
                    const contact = manifold.contacts[0].point;
                    const rx = contact.x - body2.position.x;
                    const ry = contact.y - body2.position.y;
                    body1.groundVelocity.x = body2.velocity.x - body2.angularVelocity * ry;
                    body1.groundVelocity.y = body2.velocity.y + body2.angularVelocity * rx;
                }

                if (manifold.normal.y > 0.7 && body2.inverseMass !== 0) {
                    body2.isGrounded = true;
                    const contact = manifold.contacts[0].point;
                    const rx = contact.x - body1.position.x;
                    const ry = contact.y - body1.position.y;
                    body2.groundVelocity.x = body1.velocity.x - body1.angularVelocity * ry;
                    body2.groundVelocity.y = body1.velocity.y + body1.angularVelocity * rx;
                }

                const totalInvMass = body1.inverseMass + body2.inverseMass;
                for (const contact of manifold.contacts) {
                    const impulse = Vector2.mult(manifold.normal, contact.penetration / totalInvMass / 3);
                    body1.position.sub(Vector2.mult(impulse, body1.inverseMass));
                    body2.position.add(Vector2.mult(impulse, body2.inverseMass));
                }
            }

            for (const body of this.bodies) {
                if (body.inverseMass === 0) continue;
                body.velocity.add(Vector2.mult(this.gravity, dt / substeps / 2));
                body.position.add(Vector2.mult(body.velocity, dt / substeps));
                body.rotation += body.angularVelocity * dt / substeps;
            }
        }
    }
}
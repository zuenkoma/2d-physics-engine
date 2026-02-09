import clipping from './clipping.ts';
import type Collider from './colliders/collider.ts';
import Entity from './entity.ts';
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
    entities: Entity[] = [];
    private manifoldCache: ContactManifold[] = [];

    gravity = new Vector2(0, -9.81);

    addEntity(entity: Entity) {
        if (this.entities.includes(entity)) return;
        this.entities.push(entity);
    }
    removeEntity(entity: Entity) {
        this.entities.splice(this.entities.indexOf(entity), 1);
    }

    step(dt: number, iterations = 15) {
        for (const entity of this.entities) {
            entity.onGround = false;
            if (entity.isStatic()) continue;
            entity.velocity.add(this.gravity.clone().mult(dt));
        }

        const manifolds: ContactManifold[] = [];
        for (let i = 0; i < this.entities.length; ++i) {
            const entity1 = this.entities[i];
            for (let j = i + 1; j < this.entities.length; ++j) {
                const entity2 = this.entities[j];

                for (const collider1 of entity1.colliders) {
                    for (const collider2 of entity2.colliders) {
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

                        if (entity2.position.clone().sub(entity1.position).dot(entity2.velocity.clone().sub(entity1.velocity)) <= 0) {
                            if (normal.y > 0.3) entity1.onGround = true;
                            if (normal.y < -0.3) entity2.onGround = true;
                        }

                        manifolds.push({
                            collider1, collider2,
                            contacts: points.map(([point, penetrarion]) => {
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
                                    bias: 0.5 / dt * penetrarion,
                                    normalMass: Entity.getEffectiveMass(entity1, entity2, point, normal),
                                    tangentMass: Entity.getEffectiveMass(entity1, entity2, point, normal.clone().perp()),
                                    normalImpulse, tangentImpulse
                                };
                            }),
                            normal,
                            friction: Math.sqrt(entity1.friction * entity2.friction)
                        });
                    }
                }
            }
        }
        this.manifoldCache = manifolds;

        for (let i = 0; i < iterations; ++i) {
            for (const manifold of manifolds) {
                const entity1 = manifold.collider1.entity!;
                const entity2 = manifold.collider2.entity!;

                for (const contact of manifold.contacts) {
                    const velocity1 = entity1.getVelocityAtPoint(contact.point);
                    const velocity2 = entity2.getVelocityAtPoint(contact.point);
                    const relativeVelocity = velocity1.clone().sub(velocity2);

                    const normalVelocity = relativeVelocity.dot(manifold.normal);
                    const oldNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse = Math.max(0, oldNormalImpulse - (normalVelocity - contact.bias) * contact.normalMass);

                    const normalImpulse = manifold.normal.clone().mult(contact.normalImpulse - oldNormalImpulse);
                    entity1.applyImpulse(normalImpulse, contact.point);
                    entity2.applyImpulse(normalImpulse.clone().mult(-1), contact.point);

                    const tangent = manifold.normal.clone().perp();
                    const tangentVelocity = relativeVelocity.dot(tangent);

                    const oldTangentImpulse = contact.tangentImpulse;
                    const maxTangentImpulse = manifold.friction * contact.normalImpulse;
                    contact.tangentImpulse = Math.max(-maxTangentImpulse, Math.min(maxTangentImpulse, oldTangentImpulse - tangentVelocity * contact.tangentMass));
                    const tangentImpulse = tangent.clone().mult(contact.tangentImpulse - oldTangentImpulse);
                    entity1.applyImpulse(tangentImpulse, contact.point);
                    entity2.applyImpulse(tangentImpulse.clone().mult(-1), contact.point);
                }
            }
        }

        for (const entity of this.entities) {
            entity.position.add(entity.velocity.clone().mult(dt));
            entity.rotation += entity.angularVelocity * dt;
        }
    }
}
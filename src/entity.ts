import type Collider from './colliders/collider.ts';
import Vector2 from './vector2.ts';

export default class Entity {
    colliders: Collider[] = [];

    position: Vector2;
    rotation: number;
    velocity = new Vector2(0, 0);
    angularVelocity = 0;
    friction = 0.5;
    onGround = false;

    private inverseMass = 0;
    private inverseInertia = 0;
    private fixedRotation = false;

    constructor(position = new Vector2(0, 0), rotation = 0) {
        this.position = position;
        this.rotation = rotation;
    }

    protected calculateInertia() {
        if (this.inverseMass === 0 || this.fixedRotation) {
            this.inverseInertia = 0;
            return;
        }

        let totalInertia = 0;
        const mass = 1 / this.inverseMass;

        for (const collider of this.colliders) {
            const colliderInertia = collider.calculateInertia(mass);
            const offset = collider.getCenter().sub(this.position);
            const steinerTerm = offset.lengthSquared() * mass;
            totalInertia += colliderInertia + steinerTerm;
        }

        this.inverseInertia = totalInertia > 0 ? 1 / totalInertia : 0;
    }

    isStatic() {
        return this.inverseMass === 0;
    }

    setMass(mass: number) {
        this.inverseMass = 1 / mass;
        this.calculateInertia();
    }

    setFixedRotation(fixed: boolean) {
        this.fixedRotation = fixed;
        this.calculateInertia();
    }

    addCollider(collider: Collider) {
        if (collider.entity) throw new Error('collider already associated with an entity');
        this.colliders.push(collider);
        collider.entity = this;
        this.calculateInertia();
    }
    removeCollider(collider: Collider) {
        this.colliders.splice(this.colliders.indexOf(collider), 1);
        collider.entity = null;
        this.calculateInertia();
    }

    getVelocityAtPoint(point: Vector2) {
        return this.velocity.clone().add(point.clone().sub(this.position).perp().mult(this.angularVelocity));
    }

    applyImpulse(impulse: Vector2, applicationPoint = this.position) {
        if (this.inverseMass === 0) return;
        this.velocity.add(impulse.clone().mult(this.inverseMass));
        const leverArm = applicationPoint.clone().sub(this.position);
        const torque = leverArm.cross(impulse);
        this.angularVelocity += torque * this.inverseInertia;
    }

    static getEffectiveMass(entity1: Entity, entity2: Entity, contactPoint: Vector2, normal: Vector2) {
        const lever1 = contactPoint.clone().sub(entity1.position).cross(normal);
        const lever2 = contactPoint.clone().sub(entity2.position).cross(normal);
        return 1 / (
            entity1.inverseMass +
            entity2.inverseMass +
            entity1.inverseInertia * lever1 ** 2 +
            entity2.inverseInertia * lever2 ** 2
        );
    }
}
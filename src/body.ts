import AABB from './aabb.ts';
import type Collider from './colliders/collider.ts';
import Vector2 from './vector2.ts';

export default class Body {
    colliders: Collider[] = [];

    position: Vector2;
    rotation: number;
    velocity = new Vector2(0, 0);
    angularVelocity = 0;

    friction = 0.5;
    private _inverseMass = 0;
    private _inverseInertia = 0;
    private _fixedRotation = false;

    isGrounded = false;
    groundVelocity = new Vector2(0, 0);

    constructor(position?: Vector2, rotation = 0) {
        this.position = position ? position.clone() : new Vector2(0, 0);
        this.rotation = rotation;
    }

    addCollider(collider: Collider): void {
        if (collider.body) throw new Error('collider already associated with a body');
        this.colliders.push(collider);
        collider.body = this;
        this.calculateInertia();
    }
    removeCollider(collider: Collider): void {
        this.colliders.splice(this.colliders.indexOf(collider), 1);
        collider.body = null;
        this.calculateInertia();
    }

    getAABB(): AABB {
        const aabb = new AABB();
        for (const collider of this.colliders) {
            aabb.encapsulate(collider.getAABB());
        }
        return aabb;
    }

    protected calculateInertia(): void {
        if (this._inverseMass === 0 || this._fixedRotation) {
            this._inverseInertia = 0;
            return;
        }

        let totalInertia = 0;
        const mass = 1 / this._inverseMass;

        for (const collider of this.colliders) {
            const colliderInertia = collider.calculateInertia(mass);
            const offset = collider.getCenter().sub(this.position);
            const steinerTerm = offset.lengthSquared * mass;
            totalInertia += colliderInertia + steinerTerm;
        }

        this._inverseInertia = totalInertia > 0 ? 1 / totalInertia : 0;
    }

    get inverseMass(): number {
        return this._inverseMass;
    }
    set inverseMass(inverseMass: number) {
        this._inverseMass = inverseMass;
        this.calculateInertia();
    }

    get mass(): number {
        return 1 / this._inverseMass;
    }
    set mass(mass: number) {
        this.inverseMass = 1 / mass;
    }

    get inverseInertia(): number {
        return this._inverseInertia;
    }

    get fixedRotation(): boolean {
        return this._fixedRotation;
    }
    set fixedRotation(fixed: boolean) {
        this._fixedRotation = fixed;
        this.calculateInertia();
    }

    getVelocityAtPoint(point: Vector2): Vector2 {
        return Vector2.add(this.velocity, Vector2.sub(point, this.position).perp().mult(this.angularVelocity));
    }

    applyImpulse(impulse: Vector2, applicationPoint = this.position): void {
        if (this._inverseMass === 0) return;
        this.velocity.add(Vector2.mult(impulse, this._inverseMass));
        const leverArm = Vector2.sub(applicationPoint, this.position);
        const torque = leverArm.cross(impulse);
        this.angularVelocity += torque * this._inverseInertia;
    }

    static getEffectiveMass(body1: Body, body2: Body, contactPoint: Vector2, normal: Vector2): number {
        const lever1 = Vector2.sub(contactPoint, body1.position).cross(normal);
        const lever2 = Vector2.sub(contactPoint, body2.position).cross(normal);
        return 1 / (
            body1._inverseMass +
            body2._inverseMass +
            body1._inverseInertia * lever1 ** 2 +
            body2._inverseInertia * lever2 ** 2
        );
    }
}
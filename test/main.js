import { BoxCollider, CapsuleCollider, CircleCollider, Entity, World, Vector2 } from '../dist/index.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const world = new World();

const ground = new Entity(new Vector2(0, -3), 0);
ground.addCollider(new BoxCollider(new Vector2(100, 0.3)));
world.addEntity(ground);

const player = new Entity(new Vector2(0, 0), 0);
player.addCollider(new CapsuleCollider(1.25, 0.375));
player.setFixedRotation(true);
player.setMass(1);
world.addEntity(player);

const platform1 = new Entity(new Vector2(3, -1));
platform1.addCollider(new BoxCollider(new Vector2(2, 0.5)));
world.addEntity(platform1);

const circle1 = new Entity(new Vector2(3, 0));
circle1.addCollider(new CircleCollider(0.5));
circle1.setMass(1);
world.addEntity(circle1);

const box1 = new Entity(new Vector2(6, -0.5));
box1.addCollider(new BoxCollider(new Vector2(1, 1)));
box1.setMass(1);
world.addEntity(box1);

const box2 = new Entity(new Vector2(6.3, -2));
box2.addCollider(new BoxCollider(new Vector2(1, 1)));
box2.setMass(1);
world.addEntity(box2);

const sbox = new Entity(new Vector2(-3, -2.7));
sbox.addCollider(new BoxCollider(new Vector2(0.3, 0.3)));
sbox.setMass(3);
world.addEntity(sbox);

const paddle = new Entity(new Vector2(-3, -2.4));
paddle.addCollider(new BoxCollider(new Vector2(3, 0.3)));
paddle.setMass(1);
world.addEntity(paddle);

const box3 = new Entity(new Vector2(-4, -2));
box3.addCollider(new BoxCollider(new Vector2(0.5, 0.5)));
box3.setMass(0.3);
world.addEntity(box3);

const pressed = new Set();
addEventListener('keydown', event => pressed.add(event.code));
addEventListener('keyup', event => pressed.delete(event.code));

const dt = 1 / 60;
let jump = false;
setInterval(() => {
    const playerDir = +pressed.has('KeyD') - +pressed.has('KeyA');
    if (player.onGround) {
        player.applyImpulse(new Vector2(playerDir, 0));
        if (pressed.has('KeyW') && !jump) {
            player.applyImpulse(new Vector2(0, 10));
            jump = true;
        }
    }
    else {
        player.applyImpulse(new Vector2(playerDir / 5, 0));
        jump = false;
    }
    player.velocity.x = Math.min(Math.max(player.velocity.x, -3), 3);
    world.step(dt);
}, dt * 1000);


const offset = new Vector2(300, 200);
function renderPoint(point, r = 5) {
    ctx.beginPath();
    ctx.arc(point.x + offset.x, point.y + offset.y, r, 0, 2 * Math.PI);
    ctx.stroke();
}
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderPoint(new Vector2(0, 0));

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(50, -50);
    ctx.lineWidth = 0.02;
    ctx.strokeStyle = 'black';
    for (const entity of world.entities) {
        for (const collider of entity.colliders) {
            collider.renderShape(ctx, false);
        }
    }
    ctx.restore();

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
import { Body, BoxCollider, CapsuleCollider, CircleCollider, Vector2, World } from '../dist/index.js';
import { renderBox, renderCapsule, renderCircle } from './render.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const world = new World();

const ground = new Body(new Vector2(0, -3), 0);
ground.addCollider(new BoxCollider(new Vector2(100, 0.3)));
world.addBody(ground);

const player = new Body(new Vector2(0, 0), 0);
player.addCollider(new CapsuleCollider(1.25, 0.375));
player.setFixedRotation(true);
player.setMass(1);
world.addBody(player);

const platform1 = new Body(new Vector2(3, -1));
platform1.addCollider(new BoxCollider(new Vector2(2, 0.5)));
world.addBody(platform1);

const circle1 = new Body(new Vector2(3, 0));
circle1.addCollider(new CircleCollider(0.5));
circle1.setMass(1);
world.addBody(circle1);

const box1 = new Body(new Vector2(6, -0.5));
box1.addCollider(new BoxCollider(new Vector2(1, 1)));
box1.setMass(1);
world.addBody(box1);

const box2 = new Body(new Vector2(6.3, -2));
box2.addCollider(new BoxCollider(new Vector2(1, 1)));
box2.setMass(1);
world.addBody(box2);

const sbox = new Body(new Vector2(-3, -2.7));
sbox.addCollider(new BoxCollider(new Vector2(0.3, 0.3)));
sbox.setMass(3);
world.addBody(sbox);

const paddle = new Body(new Vector2(-3, -2.4));
paddle.addCollider(new BoxCollider(new Vector2(3, 0.3)));
paddle.setMass(1);
world.addBody(paddle);

const box3 = new Body(new Vector2(-4, -2));
box3.addCollider(new BoxCollider(new Vector2(0.5, 0.5)));
box3.setMass(0.3);
world.addBody(box3);

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


const scale = 50;
const offset = new Vector2(300, 200);
function renderPoint(point, r = 5) {
    ctx.beginPath();
    ctx.arc(point.x + offset.x, point.y + offset.y, r, 0, 2 * Math.PI);
    ctx.stroke();
}

let mouse = null;
addEventListener('mouseenter', event => {
    mouse = new Vector2(event.pageX, event.pageY).sub(offset);
    mouse.x /= scale;
    mouse.y /= -scale;
});
addEventListener('mousemove', event => {
    mouse = new Vector2(event.pageX, event.pageY).sub(offset);
    mouse.x /= scale;
    mouse.y /= -scale;
});
addEventListener('mouseleave', () => {
    mouse = null;
});

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderPoint(new Vector2(0, 0));

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, -scale);
    ctx.lineWidth = 0.02;
    for (const body of world.bodies) {
        for (const collider of body.colliders) {
            const over = mouse && collider.containsPoint(mouse.clone());
            ctx.strokeStyle = over ? 'red' : 'black';
            if (collider instanceof BoxCollider) renderBox(collider, ctx, false);
            if (collider instanceof CapsuleCollider) renderCapsule(collider, ctx, false);
            if (collider instanceof CircleCollider) renderCircle(collider, ctx, false);
        }
    }
    ctx.restore();

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
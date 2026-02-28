export function renderBox(box, ctx, fill = false) {
    const vertices = box.getVertices();
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; ++i) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    if (fill) ctx.fill();
}

export function renderCapsule(capsule, ctx, fill = false) {
    const { start, end } = capsule.getEndpoints();
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpendicular = angle - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(end.x, end.y, capsule.radius, perpendicular, perpendicular + Math.PI);
    ctx.arc(start.x, start.y, capsule.radius, perpendicular + Math.PI, perpendicular + 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    if (fill) ctx.fill();
}

export function renderCircle(circle, ctx, fill = false) {
    const center = circle.getCenter();
    ctx.beginPath();
    ctx.arc(center.x, center.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
    if (fill) ctx.fill();
}
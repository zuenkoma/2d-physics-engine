import type Collider from './colliders/collider.ts';
import Edge from './edge.ts';
import Vector2 from './vector2.ts';

function clipEdge(edge: Edge, planeNormal: Vector2, planeOffset: number): Vector2[] {
    const startDist = planeNormal.dot(edge.start) - planeOffset;
    const endDist = planeNormal.dot(edge.end) - planeOffset;
    const clippedPoints: Vector2[] = [];
    if (startDist >= 0) clippedPoints.push(edge.start);
    if (endDist >= 0) clippedPoints.push(edge.end);
    if (startDist * endDist < 0) {
        clippedPoints.push(
            Vector2.sub(edge.end, edge.start)
                .mult(startDist / (startDist - endDist))
                .add(edge.start)
        );
    }
    return clippedPoints;
}

export default function clipping(collider1: Collider, collider2: Collider, normal: Vector2): [Vector2, number][] {
    let refEdge = collider1.getClosestEdge(Vector2.mult(normal, -1));
    let incEdge = collider2.getClosestEdge(normal);

    const refVec = refEdge.direction();
    const incVec = incEdge.direction();
    const refLenSq = refVec.lengthSquared;
    const incLenSq = incVec.lengthSquared;
    const isRefDegenerate = refLenSq < 1e-6;
    const isIncDegenerate = incLenSq < 1e-6;

    if (isRefDegenerate && isIncDegenerate) {
        const depth = Vector2.sub(refEdge.end, incEdge.start).length;
        return [[refEdge.start, depth]];
    }
    if (isRefDegenerate) {
        const perp = Vector2.perp(incVec).normalize();
        const depth = perp.dot(refEdge.start) - perp.dot(incEdge.start);
        return [[refEdge.start, depth]];
    }
    if (isIncDegenerate) {
        const perp = Vector2.perp(refVec).normalize();
        const depth = perp.dot(incEdge.start) - perp.dot(refEdge.start);
        return [[incEdge.start, depth]];
    }

    let refCollider = collider1;
    let refDir = refVec.clone();
    if (Math.abs(Vector2.div(incVec, incLenSq).dot(normal)) < Math.abs(Vector2.div(refVec, refLenSq).dot(normal))) {
        [refEdge, incEdge] = [incEdge, refEdge];
        refCollider = collider2;
        refDir = incVec.clone();
        normal = Vector2.mult(normal, -1);
    }
    refDir.normalize();

    let clipped = clipEdge(incEdge, refDir, refDir.dot(refEdge.start));
    clipped = clipEdge(new Edge(clipped[0], clipped[1]), Vector2.mult(refDir, -1), -refDir.dot(refEdge.end));

    const refPerp = Vector2.perp(refDir).mult(-1);
    const maxDepth = refPerp.dot(refCollider.getFurthestPoint(refPerp));
    const refOffset = normal.dot(refEdge.start);

    return clipped
        .filter(point => refPerp.dot(point) < maxDepth)
        .map(point => [point, refOffset - normal.dot(point)]);
}
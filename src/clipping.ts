import type Collider from './colliders/collider.ts';
import type Vector2 from './vector2.ts';

function clipSegment(segment: [Vector2, Vector2], planeNormal: Vector2, planeOffset: number) {
    const startDist = planeNormal.dot(segment[0]) - planeOffset;
    const endDist = planeNormal.dot(segment[1]) - planeOffset;
    const clippedPoints: Vector2[] = [];
    if (startDist >= 0) clippedPoints.push(segment[0]);
    if (endDist >= 0) clippedPoints.push(segment[1]);
    if (startDist * endDist < 0) {
        clippedPoints.push(
            segment[1].clone()
                .sub(segment[0])
                .mult(startDist / (startDist - endDist))
                .add(segment[0])
        );
    }
    return clippedPoints;
}

export default function clipping(collider1: Collider, collider2: Collider, normal: Vector2): [Vector2, number][] {
    let refEdge = collider1.getClosestEdge(normal);
    let incEdge = collider2.getClosestEdge(normal.clone().mult(-1));

    const refVec = refEdge[1].clone().sub(refEdge[0]);
    const incVec = incEdge[1].clone().sub(incEdge[0]);
    const refLenSq = refVec.lengthSquared();
    const incLenSq = incVec.lengthSquared();
    const isRefDegenerate = refLenSq < 1e-6;
    const isIncDegenerate = incLenSq < 1e-6;

    if (isRefDegenerate && isIncDegenerate) {
        const depth = refEdge[1].clone().sub(incEdge[0]).length();
        return [[refEdge[0], depth]];
    }
    if (isRefDegenerate) {
        const perp = incVec.clone().perp().normalize();
        const depth = perp.dot(refEdge[0]) - perp.dot(incEdge[0]);
        return [[refEdge[0], depth]];
    }
    if (isIncDegenerate) {
        const perp = refVec.clone().perp().normalize();
        const depth = perp.dot(incEdge[0]) - perp.dot(refEdge[0]);
        return [[incEdge[0], depth]];
    }

    let refCollider = collider1;
    let refDir = refVec.clone();
    if (Math.abs(incVec.clone().div(incLenSq).dot(normal)) < Math.abs(refVec.clone().div(refLenSq).dot(normal))) {
        [refEdge, incEdge] = [incEdge, refEdge];
        refCollider = collider2;
        refDir = incVec.clone();
        normal = normal.clone().mult(-1);
    }
    refDir.normalize();

    let clipped = clipSegment(incEdge, refDir, refDir.dot(refEdge[0]));
    clipped = clipSegment(clipped as [Vector2, Vector2], refDir.clone().mult(-1), -refDir.dot(refEdge[1]));

    const refPerp = refDir.clone().perp().mult(-1);
    const maxDepth = refPerp.dot(refCollider.getFurthestPoint(refPerp));
    const refOffset = normal.dot(refEdge[0]);

    return clipped
        .filter(point => refPerp.dot(point) < maxDepth)
        .map(point => [point, normal.dot(point) - refOffset]);
}
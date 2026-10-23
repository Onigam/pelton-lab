import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { group, mesh, roundedPath } from '@onigam/lab-kit/three';
import { anchor, bake, type Device, type Palette } from './common';
import { batteryCanPort, batteryPort, PORT as P, ROOM } from './layout';

// Every cable of the room as rounded polylines (scene space). Paired +/- runs are laid out
// so they never cross (the outer cable of each U/L bend runs lower). The same routes feed
// the schematic overlay (flows.ts), so the animated dashes follow the real copper.

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ZW = 0.034; // cable centre-line when clipped flat on the OSB

/** Cable routes, all oriented from source to sink of the energy flow. */
export function cableRoutes() {
  const bp = batteryPort(true);
  const bn = batteryPort(false);
  const can = batteryCanPort();
  return {
    // turbine cable in its corrugated conduit: side wall -> top gland of the DC safety box
    turbine: [
      v(ROOM.x0 - 0.03, P.wallEntry.y, P.wallEntry.z),
      P.wallEntry.clone(),
      v(-1.46, 2.25, 0.35),
      v(-1.46, 2.25, P.dcIn.z),
      v(P.dcIn.x, 2.25, P.dcIn.z),
      P.dcIn,
    ],
    dcTsP: [P.dcOutP, v(P.dcOutP.x, 1.815, 0.045), v(P.tsInP.x, 1.815, 0.045), P.tsInP],
    dcTsN: [P.dcOutN, v(P.dcOutN.x, 1.8, 0.045), v(P.tsInN.x, 1.8, 0.045), P.tsInN],
    tsBusP: [
      P.tsOutP,
      v(P.tsOutP.x, 1.77, 0.04),
      v(P.lynxHydroP.x, 1.77, ZW),
      v(P.lynxHydroP.x, 1.3, ZW),
      P.lynxHydroP,
    ],
    tsBusN: [
      P.tsOutN,
      v(P.tsOutN.x, 1.785, 0.04),
      v(P.lynxHydroN.x, 1.785, ZW),
      v(P.lynxHydroN.x, 1.3, ZW),
      P.lynxHydroN,
    ],
    // diversion controller fed from the bus, then out to the resistors
    divP: [P.lynxDivP, v(P.lynxDivP.x, 1.3, ZW), v(P.lynxDivP.x, 1.76, ZW), v(P.divBusP.x, 1.76, 0.04), P.divBusP],
    divN: [P.lynxDivN, v(P.lynxDivN.x, 1.3, ZW), v(P.lynxDivN.x, 1.745, ZW), v(P.divBusN.x, 1.745, 0.04), P.divBusN],
    dumpP: [P.divOutP, v(-0.55, P.divOutP.y, 0.07), v(-0.47, P.dumpInP.y, 0.13), P.dumpInP],
    dumpN: [P.divOutN, v(-0.54, P.divOutN.y, 0.07), v(-0.46, P.dumpInN.y, 0.13), P.dumpInN],
    // PV string from the roof, isolator, charger, bus
    pvInP: [v(P.isoInP.x, 2.38, ZW), v(P.isoInP.x, 1.78, ZW), P.isoInP],
    pvInN: [v(P.isoInN.x, 2.38, ZW), v(P.isoInN.x, 1.78, ZW), P.isoInN],
    pvP: [P.isoOutP, v(P.isoOutP.x, 1.45, 0.04), v(P.mpptPvP.x, 1.45, 0.04), P.mpptPvP],
    pvN: [P.isoOutN, v(P.isoOutN.x, 1.462, 0.04), v(P.mpptPvN.x, 1.462, 0.04), P.mpptPvN],
    mpptP: [P.mpptBatP, v(P.mpptBatP.x, 1.415, ZW), v(P.lynxMpptP.x, 1.415, ZW), P.lynxMpptP],
    mpptN: [P.mpptBatN, v(P.mpptBatN.x, 1.4, ZW), v(P.lynxMpptN.x, 1.4, ZW), P.lynxMpptN],
    // battery bank: from the bus down behind the bench, over the stack to the connectors
    battP: [
      P.lynxBatP,
      v(P.lynxBatP.x, 1.06, 0.03),
      v(-1.19, 1.0, 0.026),
      v(-1.19, 0.56, 0.026),
      v(bp.x, 0.56, 0.026),
      v(bp.x, 0.56, bp.z + 0.06),
      v(bp.x, bp.y, bp.z + 0.06),
      bp,
    ],
    battN: [
      P.lynxBatN,
      v(P.lynxBatN.x, 1.06, 0.03),
      v(-1.16, 1.0, 0.026),
      v(-1.16, 0.6, 0.026),
      v(bn.x, 0.6, 0.026),
      v(bn.x, 0.6, bn.z + 0.085),
      v(bn.x, bn.y, bn.z + 0.085),
      bn,
    ],
    // inverter DC feed, AC output to the board, house circuits through the side wall
    invP: [P.lynxInvP, v(P.lynxInvP.x, 0.99, ZW), v(P.invDcP.x, 0.99, ZW), P.invDcP],
    invN: [P.lynxInvN, v(P.lynxInvN.x, 1.005, ZW), v(P.invDcN.x, 1.005, ZW), P.invDcN],
    acOut: [P.invAcOut, v(P.invAcOut.x, 1.0, ZW), v(-0.36, 1.0, ZW), v(-0.36, 1.4, ZW), v(P.acIn.x, 1.4, ZW), P.acIn],
    house1: [P.acOut1, v(ROOM.x0 - 0.03, P.acOut1.y, P.acOut1.z)],
    house2: [P.acOut2, v(ROOM.x0 - 0.03, P.acOut2.y, P.acOut2.z)],
    // thin signal cables: BMS CAN, VE.Direct, GX touch
    can: [
      can,
      v(can.x, can.y, can.z + 0.02),
      v(can.x, 0.47, can.z + 0.02),
      v(can.x, 0.47, 0.03),
      v(-0.7, 0.47, 0.03),
      v(-0.7, 1.0, 0.03),
      v(P.invCom.x - 0.006, 1.0, ZW),
      v(P.invCom.x - 0.006, P.invCom.y, P.invCom.z),
    ],
    veDirect: [
      P.mpptCom,
      v(P.mpptCom.x, 1.42, ZW),
      v(-0.36, 1.42, ZW),
      v(-0.36, 1.012, ZW),
      v(P.invCom.x, 1.012, ZW),
      P.invCom,
    ],
    gx: [
      P.gxCable,
      v(P.gxCable.x, 1.0, ZW),
      v(P.invCom.x + 0.006, 1.0, ZW),
      v(P.invCom.x + 0.006, P.invCom.y, P.invCom.z),
    ],
    earth: [
      P.acEarth,
      v(P.acEarth.x, 1.4, ZW),
      v(-1.5, 1.4, ZW),
      v(-1.5, 0.9, 0.03),
      v(-1.5, 0.02, 0.03),
      v(-1.58, 0.02, 0.06),
    ],
  };
}
export type Routes = ReturnType<typeof cableRoutes>;

/** Tube along a rounded polyline, with a sensible segment budget. */
function cable(points: THREE.Vector3[], r: number, mat: THREE.Material, bend = 0.035, radial = 8): THREE.Mesh {
  const path = roundedPath(points, bend);
  const len = path.getLength();
  const segs = Math.min(420, Math.max(12, Math.round(len / 0.012)));
  const geo = new THREE.TubeGeometry(path, segs, r, radial, false);
  return mesh(geo, mat);
}

/** Corrugated conduit: ribbed stripes along the length via scaled UVs. */
function conduitMaterial(): THREE.MeshStandardMaterial {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 8, 0);
  g.addColorStop(0, '#6f757a');
  g.addColorStop(0.5, '#b3b8bc');
  g.addColorStop(1, '#6f757a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 });
}

function conduit(points: THREE.Vector3[], r: number, mat: THREE.Material): THREE.Mesh {
  const m = cable(points, r, mat, 0.07, 14);
  const uv = m.geometry.attributes.uv;
  const len = roundedPath(points, 0.07).getLength();
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 0.007));
  return m;
}

export function buildWiring(pal: Palette, routes: Routes): Device {
  const g = group('wiring');
  const conduitMat = conduitMaterial();
  const add = (m: THREE.Mesh) => g.add(m);

  add(conduit(routes.turbine, 0.013, conduitMat));
  add(conduit(routes.house1, 0.011, conduitMat));
  add(conduit(routes.house2, 0.011, conduitMat));

  const red = pal.cableRed;
  const black = pal.cableBlack;
  const pairs: [THREE.Vector3[], THREE.Vector3[], number][] = [
    [routes.dcTsP, routes.dcTsN, 0.0035],
    [routes.tsBusP, routes.tsBusN, 0.004],
    [routes.divP, routes.divN, 0.004],
    [routes.dumpP, routes.dumpN, 0.004],
    [routes.pvInP, routes.pvInN, 0.0035],
    [routes.pvP, routes.pvN, 0.0035],
    [routes.mpptP, routes.mpptN, 0.0045],
    [routes.battP, routes.battN, 0.007],
    [routes.invP, routes.invN, 0.0075],
  ];
  for (const [p, n, r] of pairs) {
    add(cable(p, r, red, Math.max(0.03, r * 7)));
    add(cable(n, r, black, Math.max(0.03, r * 7)));
  }
  add(cable(routes.acOut, 0.0045, pal.cableGrey));
  add(cable(routes.can, 0.0022, pal.cableBlue, 0.02, 6));
  add(cable(routes.veDirect, 0.0022, pal.cableBlue, 0.02, 6));
  add(cable(routes.gx, 0.0022, black, 0.02, 6));
  add(cable(routes.earth, 0.003, pal.cableYG, 0.03, 6));
  bake(g);

  return {
    id: 'wiring',
    group: g,
    anchor: anchor(g, [-0.6, 1.07, 0.08]),
    explode: new THREE.Vector3(0, 0, 0.2),
    label: l('Câblage DC / AC', 'DC / AC wiring'),
  };
}

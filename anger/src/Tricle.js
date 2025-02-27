import { Bodies, Body, Composite, Constraint, Vector } from "matter-js";
import Thorn from "./Thorn.js";

const { PI, cos, sin } = Math;
const xray = false;

function Tricle(x, y, radius, angryOne) {
  const angry = angryOne === undefined;
  const strokeColor = "transparent";
  const thornCount = angry ? 128 : 0;
  const thornLength = 1/3;
  const thornBaseRatio = 20;
  const thornStiffness = 0.8;
  const sensorWidth = 2;
  const maxGrowth = 4;

  const group = Body.nextGroup(true);
  const tricle = Composite.create({ label: "tricle" });
  const body = Bodies.circle(x, y, radius, {
    collisionFilter: { group },
    render: { lineWidth: 2, strokeStyle: strokeColor, fillStyle: angry ? "red": "black" }
  });
  const sensor = Bodies.circle(x, y, radius*sensorWidth, {
    isSensor: true,
    isStatic: false,
    collisionFilter: { group },
    render: {
        strokeStyle: "transparent",
        fillStyle: 'transparent',
        lineWidth: 1
    }
  });

  const thorns = [];
  for(let i=0; i<thornCount; i++) {
    const angle = (i/thornCount)*2*PI;
    thorns.push(
      Thorn.new(
        group,
        x-radius*cos(angle),
        y-radius*sin(angle),
        thornLength*thornCount/thornBaseRatio,
        maxGrowth,
        radius/(thornCount/thornBaseRatio),
        angle,
        body.render.fillStyle,
        strokeColor
      )
    );
  }

  Composite.add(tricle, sensor);
  for(let i = 0; i<thorns.length; i++) {
    const thorn = thorns[i];

    // bind one leg of thorn
    bind(thorn.body, body, thornStiffness,
      // calculate leg's offset
      Vector.sub(thorn.body.position, thorn.body.vertices[0]),
      // calculate offset from center of body towards leg of thorn
      offset(body.position, thorn.body.vertices[2], radius*1)
    );
    // bind other leg of thorn
    bind(thorn.body, body, thornStiffness,
      // calculate leg's offset
      Vector.sub(thorn.body.position, thorn.body.vertices[2]),
      // calculate offset from center of body towards leg of thorn
      offset(body.position, thorn.body.vertices[0], radius*1)
    );
    // bind center of thorn
    bind(thorn.body, body, thornStiffness,
      Vector.sub(thorn.body.vertices[1], thorn.body.position),
    );

    thorn.add(tricle);
  }
  bind(body, sensor, 1.0);

  if(angry) {
    bind(body, null, 1, null, Vector.create(x, y));
  }

  Composite.add(tricle, body);

  function offset(a, b, distance) {
    const direction = Vector.sub(b, a);
    const unitDirection = Vector.normalise(direction);

    return Vector.mult(unitDirection, distance);
  }

  function bind(bodyA, bodyB, stiffness,
    pointA = null,
    pointB = null
  ) {
    Composite.add(tricle, Constraint.create({
        bodyA,
        pointA,
        bodyB,
        pointB,
        stiffness,
        render: { visible: xray, lineWidth: 1, strokeStyle: "blue" }
    }));
  }

  /**
   * @param {import("matter-js").Composite} engine
   */
  function add(composite) {
    Composite.add(composite, tricle);
  }

  function grow() {
    for(const thorn of thorns) {
      if(Math.random() > 0.5) { continue; }

      thorn.grow();
    }
  }

  function shrink() {
    for(const thorn of thorns) {
      if(Math.random() > 0.5) { continue; }

      thorn.shrink();
    }
  }

  function act() {
    if(angry) { return; }

    if(body.speed < 1) {
      var towardsAngryOne = Vector.sub(angryOne.body.position, body.position);
      if(Vector.magnitude(towardsAngryOne) > 200) {
        Body.applyForce(body, body.position, Vector.mult(Vector.normalise(towardsAngryOne), body.mass/5));
      }
    }
  }

  function react(otherTricle) {
    if(!angry) { return; }

    if(otherTricle) {
      grow();
    } else {
      shrink();
    }
  }

  const result = {
    body,

    add,
    grow,
    shrink,
    act,
    react
  };

  body.tricle = result;
  sensor.tricle = result;

  return result;
}

export default {
    new: Tricle
};


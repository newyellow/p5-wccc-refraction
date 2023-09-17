let _mainHue = 0;

async function setup() {

  // traits
  MAX_DEPTH = int(random(3, 10));
  let MIN_RECT_RATIO = random(0.1, 0.8);
  // BEAM_SPREAD_RANGE = random(0.1, 3.0);
  BEAM_SPREAD_RANGE = 2;

  // traits

  createCanvas(windowWidth, windowHeight);
  background(30);

  colorMode(HSB);

  _mainHue = random(0, 360);

  let padding = 60;
  let xCount = 3;
  let yCount = 3;

  let rectWidth = (width - 2 * padding) / xCount;
  let rectHeight = (height - 2 * padding) / yCount;

  let refractors = [];

  let rects = subdivideRect(padding, padding, width - 2 * padding, height - 2 * padding, 0);
  // for(let i=0; i< rects.length; i++) {
  //   rects[i].draw();
  // }

  for (let i = 0; i < rects.length; i++) {
    let nowRect = rects[i];
    let nowCenterX = nowRect.x + nowRect.w * 0.5;
    let nowCenterY = nowRect.y + nowRect.h * 0.5;

    let nowRectWidth = nowRect.w * random(MIN_RECT_RATIO, 1.0);
    let nowRectHeight = nowRect.h * random(MIN_RECT_RATIO, 1.0);

    let xSizeDiff = nowRect.w - nowRectWidth;
    let ySizeDiff = nowRect.h - nowRectHeight;

    nowCenterX += random(-0.5, 0.5) * xSizeDiff;
    nowCenterY += random(-0.5, 0.5) * ySizeDiff;

    let nowRectRotation = random(-10, 10);
    // nowRectRotation = 0.0;

    let rect = new RefractionObj(nowCenterX, nowCenterY, nowRectWidth, nowRectHeight, nowRectRotation);
    refractors.push(rect);
  }
  

  // draw all refractors
  for (let i = 0; i < refractors.length; i++) {
    refractors[i].draw();
    await sleep(1);
  }

  // return null;

  // for (let x = 0; x < xCount; x++) {
  //   for (let y = 0; y < yCount; y++) {
  //     let nowX = padding + x * rectWidth;
  //     let nowY = padding + y * rectHeight;
  //     let rectCenterX = nowX + rectWidth * 0.5;
  //     let rectCenterY = nowY + rectHeight * 0.5;

  //     // let nowRectWidth = random(0.2, 0.8) * rectWidth;
  //     // let nowRectHeight = random(0.2, 0.8) * rectHeight;
  //     let nowRectWidth = lerp(0.4, 0.8, noise(nowX * 0.006, nowY * 0.006, 666)) * rectWidth;
  //     let nowRectHeight = lerp(0.2, 0.4, noise(nowX * 0.006, nowY * 0.006, 888)) * rectHeight;
  //     let sizeXDiff = rectWidth - nowRectWidth;
  //     let sizeYDiff = rectHeight - nowRectHeight;

  //     let offsetCenterX = rectCenterX + random(-0.2, 0.2) * sizeXDiff;
  //     let offsetCenterY = rectCenterY + random(-0.2, 0.2) * sizeYDiff;

  //     // let rectRotation = random(0, 360);
  //     let rectRotation = noise(nowX * 0.002, nowY * 0.002) * 720;

  //     let rect = new RefractionObj(offsetCenterX, offsetCenterY, nowRectWidth, nowRectHeight, rectRotation);
  //     refractors.push(rect);
  //   }
  // }

  // prepare beams
  let beams = [];

  let beamXCount = 30;
  let beamYCount = 10;

  let beamPadding = 15;
  let beamRectWidth = (width - 2 * beamPadding) / beamXCount;
  let beamRectHeight = (height - 2 * beamPadding) / beamYCount;


  // draw beams
  _mainHue -= 60;

  // up row
  for (let x = 0; x < beamXCount; x++) {
    let nowX = beamPadding + x * beamRectWidth;
    let nowY = beamPadding;
    let rectCenterX = nowX + beamRectWidth * 0.5;
    let rectCenterY = nowY;

    let nowRectWidth = beamRectWidth * 0.8;
    let nowRectHeight = beamRectHeight * 0.8;

    let beamRotation = 200;

    let beamColor = NYColor.newRandomColor(_mainHue);
    if(random() < 0.12)
      beamColor.h = processHue(beamColor.h + 180);
    let newBeam = new Beam(rectCenterX, rectCenterY, beamRotation, beamColor);
    beams.push(newBeam);
  }



  blendMode(ADD);
  for (let i = 0; i < beams.length; i++) {

    circle(beams[i].x, beams[i].y, 6);

    let nowBeam = beams[i];
    let nowN1 = 1.000293;
    let nowN2 = 1.52;
    let isInsideRefractor = false;

    while (true) {
      await sleep(1);

      let targetRefrector = findTargetRefractor(nowBeam, refractors);
      if (targetRefrector == null) {
        console.log("LAST BEAm DRAW");
        console.log(nowBeam);
        nowBeam.draw();
        break;
      }

      let refrectResult = getBeamRefractorResult(nowBeam, targetRefrector, nowN1, nowN2);
      console.log(refrectResult);

      if (refrectResult != false) {

        if (isInsideRefractor) {
          let beamRGB = nowBeam.color.toRgb();
          let refractorRGB = targetRefrector.color.toRgb();
          let segmentColor = {
            r: (beamRGB.r + refractorRGB.r),
            g: (beamRGB.g + refractorRGB.g),
            b: (beamRGB.b + refractorRGB.b)
          };

          colorMode(RGB);
          stroke(segmentColor.r, segmentColor.g, segmentColor.b);
        }
        else {
          colorMode(HSB);
          stroke(nowBeam.color.h, nowBeam.color.s, nowBeam.color.b);
        }

        let newSegment = new LineData(nowBeam.x, nowBeam.y, refrectResult.contactPoint.x, refrectResult.contactPoint.y);
        newSegment.draw();
        
        let beamColor = nowBeam.color.copy();
        nowBeam = new Beam(refrectResult.contactPoint.x, refrectResult.contactPoint.y, refrectResult.newAngle, beamColor);
        nowN1 = refrectResult.newN1;
        nowN2 = refrectResult.newN2;

        if (refrectResult.isReflect == false)
          isInsideRefractor = !isInsideRefractor;
      }
      else {
        console.log("DRAW LAST BEAM?");
        console.log(nowBeam);
        nowBeam.draw();
        break;
      }
    }
  }
}

// async sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
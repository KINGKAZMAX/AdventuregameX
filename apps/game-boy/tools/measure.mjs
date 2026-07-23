import sharp from 'sharp';
const f = 'dist/textures/baked-cartridge-tetris.jpg';
const m = await sharp(f).metadata();
console.log('size', m.width, m.height);
await sharp(f).extract({left:40,top:465,width:450,height:545}).toFile('tools/crop_label.png');
console.log('done');

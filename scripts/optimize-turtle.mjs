import {NodeIO} from '@gltf-transform/core';
import {dedup,prune,weld,simplify} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const input=process.argv[2];if(!input)throw new Error('Pass the original exported GLB path');
await MeshoptSimplifier.ready;
const io=new NodeIO();const bytes=await readFile(input);
function tris(doc){return doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);}
const original=await io.readBinary(bytes);const originalTriangles=tris(original);const variants=[];
for(const [mode,ratio]of [['textured',.06],['light',.008]]){
 const doc=await io.readBinary(bytes);
 await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:.05}),prune());
 if(mode==='textured'){
  for(const tex of doc.getRoot().listTextures()){
   const img=tex.getImage();if(!img)continue;
   tex.setImage(new Uint8Array(await sharp(Buffer.from(img)).resize(768,768,{fit:'inside',withoutEnlargement:true}).jpeg({quality:84}).toBuffer())).setMimeType('image/jpeg');
  }
 }else{
  const cache=new Map();
  for(const material of doc.getRoot().listMaterials()){
   const tex=material.getBaseColorTexture();if(tex){const {data,info}=await sharp(Buffer.from(tex.getImage())).ensureAlpha().raw().toBuffer({resolveWithObject:true});cache.set(material,{data,width:info.width,height:info.height});}
  }
  for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
   const material=primitive.getMaterial(),image=cache.get(material),uv=primitive.getAttribute('TEXCOORD_0'),count=primitive.getAttribute('POSITION').getCount();const colors=new Float32Array(count*3);
   for(let i=0;i<count;i++){
    let rgb=[.4,.65,.32];
    if(image&&uv){const p=uv.getElement(i,[]),x=Math.max(0,Math.min(image.width-1,Math.round(p[0]*(image.width-1)))),y=Math.max(0,Math.min(image.height-1,Math.round(p[1]*(image.height-1))));rgb=Array.from(image.data.subarray((y*image.width+x)*4,(y*image.width+x)*4+3)).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});}
    colors.set(rgb,i*3);
   }
   primitive.setAttribute('COLOR_0',doc.createAccessor('Aholo texture baked colors').setType('VEC3').setArray(colors).setBuffer(doc.getRoot().listBuffers()[0]));
   primitive.setAttribute('TEXCOORD_0',null);
   primitive.setMaterial(doc.createMaterial('Aholo vertex-color preview').setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(1));
  }
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.2,error:.15}),prune());
 }
 const out=await io.writeBinary(doc),file=mode==='textured'?'assets/aholo-turtle.glb':'assets/aholo-turtle-light.glb';await writeFile(file,out);
 const j={file,bytes:out.length,triangles:tris(doc),sha256:createHash('sha256').update(out).digest('hex')};variants.push(j);console.log(JSON.stringify(j));
}
const info={variants,name:'低模海龟',source:'Aholo Lux3D 图生 3D · 用户导出素材',verifiedAholo:true,verification:'已查看 Aholo 完成状态与贴图预览，并与用户上传导出包核对',receivedAt:'2026-11-06',originalFile:'低模海龟.glb',originalBytes:bytes.length,originalTriangles,originalSha256:createHash('sha256').update(bytes).digest('hex'),pipeline:'glTF Transform simplification; 768px JPEG textures; vertex-color lightweight derivative',taskId:null,generatedAt:null,note:'未取得任务编号或精确生成时间，不作推测。完整原始导出包保留在用户上传文件中。'};
await writeFile('assets/turtle.provenance.json',JSON.stringify(info,null,2)+'\n');

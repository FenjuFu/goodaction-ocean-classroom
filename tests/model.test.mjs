import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {deinterleaveGeometry} from 'three/addons/utils/BufferGeometryUtils.js';
test('lightweight Aholo mesh has usable independent attributes for SVG projection',async()=>{
 const bytes=await readFile(new URL('../assets/aholo-turtle-light.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let count=0;
 gltf.scene.traverse(o=>{if(!o.geometry)return;count++;deinterleaveGeometry(o.geometry);const pos=o.geometry.getAttribute('position'),color=o.geometry.getAttribute('color');assert.equal(!!pos.isInterleavedBufferAttribute,false);assert.equal(!!color.isInterleavedBufferAttribute,false);assert.equal(pos.count,color.count);assert.ok(pos.count>1000);for(const v of pos.array)assert.ok(Number.isFinite(v)&&Math.abs(v)<.3);for(const v of color.array)assert.ok(v>=0&&v<=1);});assert.ok(count>0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{parsePlan,validatePlan} from '../worker/index.js';
const sample={title:'海洋小课堂',objective:'认识海洋垃圾',intro:'和小蓝一起行动',quiz:[0,1,2].map(n=>({question:'知识问题'+n,options:['A','B','C'],answer:n,explanation:'学习解释'}))};
const makeRequest=(path,body,headers={})=>new Request('https://classroom.example'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
test('homepage is real HTML and engine is served locally',async()=>{const r=await worker.fetch(makeRequest('/'),{},{});assert.equal(r.status,200);assert.match(await r.text(),/海洋守护行动/);const js=await worker.fetch(makeRequest('/app.js'),{},{});assert.match(js.headers.get('Content-Type'),/javascript/);assert.ok((await js.text()).length>100000);});
test('unconfigured services are reported honestly without exposing secrets',async()=>{const r=await worker.fetch(makeRequest('/api/status'),{SPARK_API_KEY:'secret-do-not-echo'},{});assert.deepEqual(await r.json(),{astron:false,spark:false,aholo:false,mode:'built-in-until-connected',assetProvenance:'aholo-lux3d-user-export'});const p=await worker.fetch(makeRequest('/api/plan',{provider:'spark',prompt:'海洋'}),{},{});assert.equal(p.status,503);const a=await worker.fetch(makeRequest('/api/asset/create',{}),{},{});assert.equal(a.status,503);});
test('cross-origin and unauthenticated paid calls are rejected before fetch',async()=>{const env={SPARK_BASE_URL:'https://example.com/v1',SPARK_MODEL:'spark2.6'};const cross=await worker.fetch(makeRequest('/api/plan',{provider:'spark',prompt:'海洋'},{Origin:'https://evil.example'}),env,{});assert.equal(cross.status,403);const noauth=await worker.fetch(makeRequest('/api/plan',{provider:'spark',prompt:'海洋'}),env,{});assert.equal(noauth.status,401);});
test('plan parser enforces exactly three safe, bounded quiz questions',()=>{assert.equal(parsePlan('```json\n'+JSON.stringify(sample)+'\n```').quiz.length,3);assert.throws(()=>validatePlan({...sample,quiz:sample.quiz.slice(0,2)}));assert.throws(()=>validatePlan({...sample,quiz:sample.quiz.map(q=>({...q,answer:9}))}));assert.throws(()=>parsePlan('not json'));});
test('four-choice model output keeps every option and its correct answer',()=>{const plan={...sample,quiz:sample.quiz.map(q=>({...q,options:['A','B','C','D'],answer:3}))};assert.deepEqual(parsePlan(JSON.stringify(plan)),plan);assert.throws(()=>validatePlan({...plan,quiz:plan.quiz.map(q=>({...q,options:['A','B'],answer:0}))}));assert.throws(()=>validatePlan({...plan,quiz:plan.quiz.map(q=>({...q,answer:4}))}));});
test('Spark adapter uses configured model and validates generated content (mock upstream)',async()=>{const original=globalThis.fetch;let captured;globalThis.fetch=async(url,options)=>{captured={url,options};return Response.json({choices:[{message:{content:'',tool_calls:[{type:'function',function:{name:'create_lesson',arguments:JSON.stringify(sample)}}]}}]});};try{const r=await worker.fetch(makeRequest('/api/plan',{provider:'spark',prompt:'海洋教育'},{'oai-authenticated-user-id':'test-spark'}),{SPARK_BASE_URL:'https://spark.example/v1',SPARK_MODEL:'spark2.6',SPARK_API_KEY:'test-only'},{});assert.equal(r.status,200);assert.equal((await r.json()).plan.title,sample.title);assert.equal(captured.url,'https://spark.example/v1/chat/completions');assert.equal(captured.options.redirect,'manual');assert.equal(JSON.parse(captured.options.body).enable_thinking,false);assert.equal(JSON.parse(captured.options.body).model,'spark2.6');assert.equal(JSON.parse(captured.options.body).tool_choice.function.name,'create_lesson');}finally{globalThis.fetch=original;}});
test('Spark retries a malformed reply once and validates the real second reply (mock upstream)',async()=>{const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>Response.json({choices:[{message:{content:++calls===1?'malformed':JSON.stringify(sample)}}]});try{const r=await worker.fetch(makeRequest('/api/plan',{provider:'spark',prompt:'海洋教育'},{'oai-authenticated-user-id':'retry-test'}),{SPARK_BASE_URL:'https://spark.example/v2',SPARK_MODEL:'spark-x2.6-4b'},{});assert.equal(r.status,200);assert.equal(calls,2);assert.deepEqual((await r.json()).plan,sample);}finally{globalThis.fetch=original;}});
test('Astron adapter honors actual workflow input name and choice shape (mock upstream)',async()=>{const original=globalThis.fetch;let body;globalThis.fetch=async(url,options)=>{body=JSON.parse(options.body);return Response.json({code:0,choices:{text:[{content:JSON.stringify(sample)}]}});};try{const r=await worker.fetch(makeRequest('/api/plan',{provider:'astron',prompt:'教育'},{'oai-authenticated-user-id':'test-astron'}),{ASTRON_SERVICE_URL:'https://astron.example/workflow/v1/chat/completions',ASTRON_API_KEY:'key',ASTRON_API_SECRET:'secret',ASTRON_FLOW_ID:'flow',ASTRON_INPUT_NAME:'request'},{});assert.equal(r.status,200);assert.equal(body.flow_id,'flow');assert.equal(body.stream,false);assert.match(body.parameters.request,/教育/);}finally{globalThis.fetch=original;}});
test('Aholo adapter uses raw key, fixed turtle prompt, and numeric task id (mock upstream)',async()=>{const original=globalThis.fetch;let options;globalThis.fetch=async(url,o)=>{assert.equal(url,'https://api.aholo3d.cn/lux3d/v1/generate/text-to-3d/task/create');options=o;return Response.json({c:'0',d:'123456'});};try{const r=await worker.fetch(makeRequest('/api/asset/create',{}, {'oai-authenticated-user-id':'test-aholo'}),{AHOLO_API_KEY:'test-only'},{});assert.equal(r.status,200);assert.equal((await r.json()).taskId,'123456');assert.equal(options.headers.Authorization,'test-only');assert.deepEqual(JSON.parse(options.body).outputFormat,['glb']);}finally{globalThis.fetch=original;}});

test('published Aholo assets are self contained and match recorded provenance',async()=>{
 const meta=await (await worker.fetch(makeRequest('/api/bundled-asset'),{},{})).json();
 assert.equal(meta.verifiedAholo,true);assert.equal(meta.originalTriangles,283682);assert.equal(meta.originalSha256,'38666a64479beb46176300860376604909124e7d265db1bfea84079af6077a4f');
 for(const filename of ['aholo-turtle.glb','aholo-turtle-light.glb']){const r=await worker.fetch(makeRequest('/assets/'+filename),{},{});assert.equal(r.status,200);const bytes=new Uint8Array(await r.arrayBuffer());const view=new DataView(bytes.buffer);assert.equal(view.getUint32(0,true),0x46546c67);assert.equal(view.getUint32(8,true),bytes.length);const length=view.getUint32(12,true);const gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+length)));assert.ok(gltf.meshes.length);assert.ok((gltf.images||[]).every(i=>!i.uri));assert.ok(gltf.buffers.every(b=>!b.uri));const expected=meta.variants.find(v=>v.file.endsWith(filename));assert.equal(bytes.length,expected.bytes);const hash=await crypto.subtle.digest('SHA-256',bytes);assert.equal(Buffer.from(hash).toString('hex'),expected.sha256);}
});

// Regression: model punctuation must not discard an otherwise complete course.
test('repairs complete JSON punctuation while rejecting missing questions and invalid answers',()=>{
 const broken=JSON.stringify(sample).replace(',"objective"',' "objective"').replace(',"intro"',',"intro"');
 assert.deepEqual(parsePlan(broken),sample);
 assert.throws(()=>parsePlan(JSON.stringify(sample).slice(0,-1)));
 assert.throws(()=>parsePlan(JSON.stringify({...sample,quiz:sample.quiz.slice(0,2)}).replace(',"objective"',' "objective"')));
 assert.throws(()=>parsePlan(JSON.stringify({...sample,quiz:sample.quiz.map(q=>({...q,answer:8}))}).replace(',"objective"',' "objective"')));
});
test('Astron retries one invalid course and uses only the validated second response (mock upstream)',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>Response.json({code:0,choices:[{delta:{content:++calls===1?'bad output':JSON.stringify(sample)}}]});
 try{
  const env={ASTRON_SERVICE_URL:'https://astron.example/workflow/v1/chat/completions',ASTRON_API_KEY:'key',ASTRON_API_SECRET:'secret',ASTRON_FLOW_ID:'flow'};
  const request=makeRequest('/api/plan',{provider:'astron',prompt:'三题海洋环保课'},{'oai-authenticated-user-id':'astron-retry'});
  const response=await worker.fetch(request,env,{});assert.equal(response.status,200);assert.equal(calls,2);assert.deepEqual((await response.json()).plan,sample);
 }finally{globalThis.fetch=original;}
});

test('English classroom is complete HTML with its own lesson bundle',async()=>{
 const response=await worker.fetch(makeRequest('/en/'),{},{});const html=await response.text();
 assert.equal(response.status,200);assert.match(html,/<html lang="en">/);assert.match(html,/Blue Ocean Classroom/);assert.match(html,/Create a lesson/);assert.match(html,/app\.en\.js/);
 const client=await worker.fetch(makeRequest('/app.en.js'),{},{});const js=await client.text();assert.match(js,/Ocean Guardian Mission/);assert.doesNotMatch(js,/海洋守护行动/);
});
test('English generation passes a language requirement to the real model adapter (mock upstream)',async()=>{
 const original=globalThis.fetch;let payload;
 globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return Response.json({choices:[{message:{content:JSON.stringify(sample)}}]});};
 try{
  const response=await worker.fetch(makeRequest('/api/plan?lang=en',{provider:'spark',prompt:'A lesson about ocean plastic',lang:'en'},{'oai-authenticated-user-id':'english-test'}),{SPARK_BASE_URL:'https://spark.example/v2',SPARK_MODEL:'spark-x2.6-4b'},{});
  assert.equal(response.status,200);assert.match(payload.messages[0].content,/MUST be in English/);assert.equal((await response.json()).provider,'Spark-X2.6-4B model service');
  const missing=await worker.fetch(makeRequest('/api/plan?lang=en',{provider:'astron',prompt:'Ocean care',lang:'en'}),{},{});assert.equal(missing.status,503);assert.doesNotMatch((await missing.json()).error,/[\u4e00-\u9fff]/);
 }finally{globalThis.fetch=original;}
});
